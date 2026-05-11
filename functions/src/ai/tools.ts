import { ChatCompletionTool } from "openai/resources/chat/completions";

export const TOOLS: ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "get_current_time",
            description: "Get the current date and time to answer questions like 'what time is it?' or 'what day is today?'",
            parameters: {
                type: "object",
                properties: {},
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_available_slots",
            description: "Get available appointment slots for a specific date and professional. Use this before booking.",
            parameters: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        description: "Date in YYYY-MM-DD format"
                    },
                    professional_name: {
                        type: "string",
                        description: "Name of the professional to filter by (optional)"
                    }
                },
                required: ["date"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "create_appointment",
            description: "Book a new appointment. MUST verify availability first.",
            parameters: {
                type: "object",
                properties: {
                    date: { type: "string", description: "YYYY-MM-DD" },
                    time: { type: "string", description: "HH:mm" },
                    client_name: { type: "string" },
                    phone: { type: "string" },
                    professional_name: { type: "string" }
                },
                required: ["date", "time", "client_name", "professional_name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "move_appointment",
            description: "Move an existing appointment to a new date/time.",
            parameters: {
                type: "object",
                properties: {
                    client_name: { type: "string" },
                    current_date: { type: "string", description: "YYYY-MM-DD (approximate is ok)" },
                    new_date: { type: "string", description: "YYYY-MM-DD" },
                    new_time: { type: "string", description: "HH:mm" }
                },
                required: ["new_date", "new_time"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_appointments",
            description: "Get a list of existing booked appointments for a date. Use this to see what is occupied.",
            parameters: {
                type: "object",
                properties: {
                    date: { type: "string", description: "YYYY-MM-DD" },
                    professional_name: { type: "string" }
                },
                required: ["date"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "delete_appointment",
            description: "Cancel/delete an existing appointment. Use this when user says 'cancelar', 'eliminar', 'borrar' a turno.",
            parameters: {
                type: "object",
                properties: {
                    client_name: { type: "string", description: "Name of the client whose appointment to delete" },
                    date: { type: "string", description: "YYYY-MM-DD of the appointment (optional if only one exists)" }
                },
                required: ["client_name"]
            }
        }
    }
];
