import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Ensure Firebase is initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// Export the named database instance
export const db = getFirestore(admin.app());
