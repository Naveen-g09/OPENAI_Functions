import { config } from 'dotenv';
import OpenAI from "openai";

config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error('OpenAI API key not found. Make sure it\'s set in the .env file.');
    process.exit(1);
}

const openai = new OpenAI({
    key: apiKey,
});

// Function to get the weather
function getWeather(location) {
    if (location.toLowerCase().includes("tokyo")) {
        return { location: "Tokyo", temperature: "10", unit: "celsius" };
    } else {
        return { location, temperature: "unknown" };
    }
}

async function runConversation() {
    // Send the conversation to the model
    const messages = [
        { role: "user", content: "What's the weather like in Tokyo?" },
    ];

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages,
    });

    // Check if the model wanted to call a function
    const responseMessage = response.choices[0].message;
    if (responseMessage.tool_calls) {
        // Call the function
        const toolCall = responseMessage.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        const functionResponse = getWeather(functionArgs.location);

        // Extend conversation with function response
        messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: JSON.stringify(functionResponse),
        });

        // Get a new response from the model
        const secondResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            messages,
        });

        return secondResponse.choices;
    } else {
        console.log("No tool calls detected in the response.");
        return response.choices;
    }
}

runConversation().then(console.log).catch(console.error);
