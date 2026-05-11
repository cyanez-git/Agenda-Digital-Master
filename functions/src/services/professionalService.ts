import { db } from '../db';

export const getProfessionals = async (clientId: string) => {
    const configSnap = await db.collection("configs").doc(clientId).get();
    if (!configSnap.exists) return [];

    const config = configSnap.data() || {};
    return config.professionals || [];
};

export const findProfessionalByName = async (clientId: string, nameQuery: string) => {
    const pros = await getProfessionals(clientId);
    const lower = nameQuery.toLowerCase();

    // Fuzzy search (simple includes for now)
    return pros.find((p: any) => p.name.toLowerCase().includes(lower));
};
