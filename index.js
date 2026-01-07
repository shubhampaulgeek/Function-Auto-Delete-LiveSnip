import { Client, Databases, Storage } from "node-appwrite";

export default async ({ log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const storage = new Storage(client);

    const DATABASE_ID = process.env.DATABASE_ID;
    const COLLECTION_ID = process.env.COLLECTION_ID;

    const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID
    );

    let deleted = 0;

    for (const clip of result.documents) {
      const createdAt = new Date(clip.createdAt).getTime();

      if (now - createdAt >= SIX_MONTHS_MS) {

        // Optional: delete storage file
        if (clip.bucketId && clip.fileId) {
          await storage.deleteFile(clip.bucketId, clip.fileId);
        }

        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTION_ID,
          clip.$id
        );

        deleted++;
      }
    }

    log(`Cleanup completed. Deleted ${deleted} clips.`);
  } catch (err) {
    error(err.message);
  }
};
