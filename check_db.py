import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_db():
    load_dotenv()
    url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    print(f"Connecting to: {url}")
    client = AsyncIOMotorClient(url)
    try:
        # The ismaster command is cheap and does not require auth.
        await client.admin.command('ismaster')
        print("MongoDB Connection: SUCCESS")
        
        db_name = os.getenv("DB_NAME", "agrismart_db")
        db = client[db_name]
        
        # Check collections
        collections = await db.list_collection_names()
        print(f"Collections in {db_name}: {collections}")
        
        for coll in ["marketplace", "news"]:
            count = await db[coll].count_documents({})
            print(f"  - {coll}: {count} documents")
            
    except Exception as e:
        print(f"MongoDB Connection: FAILED - {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
