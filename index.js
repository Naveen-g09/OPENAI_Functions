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
// Example dummy function hard coded to return the same weather
// In production, this could be your backend API or an external API
function getCurrentWeather(location, unit = "fahrenheit") {
  if (location.toLowerCase().includes("tokyo")) {
    return JSON.stringify({ location: "Tokyo", temperature: "10", unit: "celsius" });
  } else if (location.toLowerCase().includes("san francisco")) {
    return JSON.stringify({ location: "San Francisco", temperature: "72", unit: "fahrenheit" });
  } else if (location.toLowerCase().includes("paris")) {
    return JSON.stringify({ location: "Paris", temperature: "22", unit: "fahrenheit" });
  } else {
    return JSON.stringify({ location, temperature: "unknown" });
  }
}


async function runConversation() {
    // Step 1: send the conversation and available functions to the model
    const messages = [
      { role: "user", content: "What's the weather like in San Francisco, Tokyo, and Paris?" },
    ];
    const tools = [
      {
        type: "function",
        function: {
          name: "get_current_weather",
          description: "Get the current weather in a given location",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA",
              },
              unit: { type: "string", enum: ["celsius", "fahrenheit"] },
            },
            required: ["location"],
          },
        },
      },
    ];
  
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });
  
    const responseMessage = response.choices[0].message;
  
    // Step 2: check if the model wanted to call a function
    if (responseMessage.tool_calls) {
      // Step 3: call the function
      const toolCalls = responseMessage.tool_calls;
      const availableFunctions = {
        get_current_weather: getCurrentWeather,
      };
  
      messages.push(responseMessage); // Extend conversation with assistant's reply
  
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        if (functionToCall) {
          const functionArgs = JSON.parse(toolCall.function.arguments);
          const functionResponse = functionToCall(
            functionArgs.location,
            functionArgs.unit
          );
  
          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: functionResponse,
          }); // Extend conversation with function response
        } else {
          console.error(`Function "${functionName}" not found in availableFunctions.`);
        }
      }
  
      const secondResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: messages,
      });
  
      return secondResponse.choices;
    } else {
      console.log("No tool calls detected in the response.");
      return response.choices;
    }
  }
  
  runConversation().then(console.log).catch(console.error);
  