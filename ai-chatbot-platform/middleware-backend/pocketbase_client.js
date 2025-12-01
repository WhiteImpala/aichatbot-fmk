import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Function to authenticate as admin (needed for server-side operations)
export const authenticateAdmin = async () => {
    try {
        if (pb.authStore.isValid) {
            return pb;
        }
        await pb.collection('_superusers').authWithPassword(
            process.env.POCKETBASE_ADMIN_EMAIL,
            process.env.POCKETBASE_ADMIN_PASSWORD
        );
        console.log('Pocketbase Admin Authenticated');
    } catch (error) {
        console.error('Pocketbase Authentication Failed:', error);
    }
    return pb;
};

export default pb;
