import { Client, Account, Storage, Databases, ID, Query } from 'appwrite';

const client = new Client();

client
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69c3b9200030a448cc3b');

export const account = new Account(client);
export const storage = new Storage(client);
export const databases = new Databases(client);

// IDs for our infrastructure
export const BUCKET_ID = 'pdf-vault';
export const DATABASE_ID = 'bentopdf';
export const COLLECTION_ID = 'documents';

export async function initAppwrite() {
    try {
        await account.get();
        console.log('Appwrite: Session already exists');
    } catch (err) {
        try {
            await account.createAnonymousSession();
            console.log('Appwrite: Anonymous session created');
        } catch (authErr) {
            console.error('Appwrite: Failed to initialize session', authErr);
        }
    }
}

/**
 * Uploads a PDF file to Appwrite Storage and saves its metadata to the Database.
 */
export async function uploadPDFToCloud(file: File) {
    try {
        // 1. Get current user ID for ownership
        const user = await account.get();
        
        // 2. Upload to Storage
        const uploadedFile = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            file
        );
        
        // 3. Save metadata to Database
        await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(),
            {
                fileId: uploadedFile.$id,
                fileName: file.name,
                userId: user.$id,
                size: file.size,
                createdAt: new Date().toISOString()
            }
        );
        
        return uploadedFile;
    } catch (error) {
        console.error('Appwrite: Cloud upload failed', error);
        throw error;
    }
}

/**
 * Fetches the document history for the current user.
 */
export async function getDocumentHistory() {
    try {
        const user = await account.get();
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.equal('userId', user.$id), Query.orderDesc('createdAt')]
        );
        return response.documents;
    } catch (error) {
        console.error('Appwrite: Failed to fetch history', error);
        return [];
    }
}

export default client;

