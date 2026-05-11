import OpenAI from "openai";
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeAudioBuffer = async (audioBase64: string): Promise<string> => {
    try {
        // Convert Base64 to Buffer
        const buffer = Buffer.from(audioBase64, 'base64');

        // Create a temporary file (Whisper API needs a 'file' object or path)
        const tempFilePath = path.join(os.tmpdir(), `audio_${Date.now()}.webm`);
        fs.writeFileSync(tempFilePath, buffer);

        console.log("[Transcription] File created at:", tempFilePath, "Size:", buffer.length);

        // Call OpenAI Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: "whisper-1",
            language: "es", // Force Spanish
            prompt: "Agenda Digital. Mover turno. Paciente. Profesional. Horario. Confirmar. Cancelar." // Context keywords
        });

        // Cleanup
        fs.unlinkSync(tempFilePath);

        console.log("[Transcription] Result:", transcription.text);
        return transcription.text;

    } catch (error: any) {
        console.error("[Transcription] Error:", error);
        throw new Error("Transcription failed: " + error.message);
    }
};
