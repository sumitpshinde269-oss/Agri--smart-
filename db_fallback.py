import json
import os
import asyncio
from datetime import datetime, timezone

class InMemoryCursor:
    def __init__(self, documents, query=None, projection=None, sort_params=None, limit_val=None):
        self.documents = documents
        self.query = query or {}
        self.projection = projection
        self.sort_params = sort_params
        self.limit_val = limit_val

    def sort(self, key_or_list, direction=None):
        if direction is not None:
            self.sort_params = [(key_or_list, direction)]
        else:
            self.sort_params = key_or_list
        return self

    def limit(self, val):
        self.limit_val = val
        return self

    async def to_list(self, length=None):
        # Filter
        filtered = []
        for doc in self.documents:
            match = True
            for k, v in self.query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                doc_copy = dict(doc)
                filtered.append(doc_copy)

        # Sort (normalize keys so datetime/str/None never crash comparisons)
        def _sort_key(val):
            if val is None:
                return ""
            if isinstance(val, datetime):
                return val.isoformat()
            return str(val)

        if self.sort_params:
            if isinstance(self.sort_params, list):
                for key, direction in reversed(self.sort_params):
                    reverse = (direction == -1)
                    filtered.sort(key=lambda x, k=key: _sort_key(x.get(k)), reverse=reverse)
            elif isinstance(self.sort_params, str):
                reverse = (direction == -1) if direction else False
                key = self.sort_params
                filtered.sort(key=lambda x, k=key: _sort_key(x.get(k)), reverse=reverse)

        # Limit
        limit = self.limit_val
        if length is not None:
            if limit is not None:
                limit = min(limit, length)
            else:
                limit = length

        if limit is not None:
            filtered = filtered[:limit]

        # Projection
        if self.projection:
            exclude = [k for k, v in self.projection.items() if v == 0]
            include = [k for k, v in self.projection.items() if v == 1]
            for doc in filtered:
                for k in exclude:
                    doc.pop(k, None)
                if include:
                    keys = list(doc.keys())
                    for k in keys:
                        if k not in include:
                            doc.pop(k, None)

        return filtered

class InMemoryCollection:
    def __init__(self, db, name):
        self.db = db
        self.name = name

    def _get_docs(self):
        if self.name not in self.db._data:
            self.db._data[self.name] = []
        return self.db._data[self.name]

    async def count_documents(self, filter):
        docs = self._get_docs()
        count = 0
        for doc in docs:
            match = True
            for k, v in filter.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                count += 1
        return count

    async def insert_one(self, doc):
        docs = self._get_docs()
        docs.append(dict(doc))
        self.db._save()
        return doc

    async def insert_many(self, documents):
        docs = self._get_docs()
        for doc in documents:
            docs.append(dict(doc))
        self.db._save()
        return documents

    async def delete_many(self, filter=None):
        filter = filter or {}
        docs = self._get_docs()
        if not filter:
            docs.clear()
        else:
            kept = []
            for doc in docs:
                match = all(doc.get(k) == v for k, v in filter.items())
                if not match:
                    kept.append(doc)
            docs.clear()
            docs.extend(kept)
        self.db._save()
        return {"deleted": True}

    def find(self, query=None, projection=None, sort=None, limit=None):
        docs = self._get_docs()
        return InMemoryCursor(docs, query=query, projection=projection, sort_params=sort, limit_val=limit)

class InMemoryDatabase:
    def __init__(self, client, name):
        self.client = client
        self.name = name
        self._filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db_fallback.json")
        self._data = {}
        self._load()

    def _load(self):
        if os.path.exists(self._filepath):
            try:
                with open(self._filepath, 'r') as f:
                    serialized = json.load(f)
                self._data = {}
                for col_name, docs in serialized.items():
                    self._data[col_name] = []
                    for doc in docs:
                        parsed_doc = {}
                        for k, v in doc.items():
                            if isinstance(v, str) and (v.endswith('Z') or '+00:00' in v) and len(v) >= 19:
                                try:
                                    val = v.replace('Z', '+00:00')
                                    parsed_doc[k] = datetime.fromisoformat(val)
                                except ValueError:
                                    parsed_doc[k] = v
                            else:
                                parsed_doc[k] = v
                        self._data[col_name].append(parsed_doc)
            except Exception as e:
                print(f"Error loading fallback DB: {e}")
                self._data = {}
        else:
            self._data = {}

    def _save(self):
        try:
            class DateTimeEncoder(json.JSONEncoder):
                def default(self, o):
                    if isinstance(o, datetime):
                        return o.isoformat()
                    return super().default(o)
            with open(self._filepath, 'w') as f:
                json.dump(self._data, f, cls=DateTimeEncoder, indent=2)
        except Exception as e:
            print(f"Error saving fallback DB: {e}")

    def __getitem__(self, name):
        return InMemoryCollection(self, name)

    async def list_collection_names(self):
        return list(self._data.keys())

    @property
    def admin(self):
        class AdminCommand:
            async def command(self, cmd_name):
                if cmd_name == "ismaster":
                    return {"ok": 1, "ismaster": True}
                return {"ok": 1}
        return AdminCommand()

class InMemoryMotorClient:
    def __init__(self, url=None, **kwargs):
        self.url = url
        self._databases = {}

    def __getitem__(self, name):
        if name not in self._databases:
            self._databases[name] = InMemoryDatabase(self, name)
        return self._databases[name]

    def close(self):
        pass

    @property
    def admin(self):
        class AdminCommand:
            async def command(self, cmd_name):
                if cmd_name == "ismaster":
                    return {"ok": 1, "ismaster": True}
                return {"ok": 1}
        return AdminCommand()
