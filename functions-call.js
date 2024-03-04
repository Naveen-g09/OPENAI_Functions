// import { Configuration, OpenAIApi } from 'openai';
// const configuration = new Configuration({
//     organizationId: 'org-Q1jfViwCcVhNC0C7hn57bHsy',
//     apiKey: '',
// });

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
});

function helloWorld(appendString) {
    return "Hello, world!";
}

async function callChatGPTWithFunctions(appendString) {
    let chat = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo-0613',
        messages: [
            {
                role: 'system',
                content: 'Perfroming a function call',
            }, {
                role: 'user',
                content: 'What is the weather in Tokyo?',
            }
        ],
        functions: [
            {
                name: "helloWorld",
                description: "A simple function that returns the string 'Hello, world!'",
                parameters:
                {
                    type: "object",
                    properties: {
                        appendString: {
                            type: "string",
                            description: "A string to append to the end of the 'Hello, world!' string."
                        },
                    },
                    require: ["appendString"],
                }
            }
        ],
        function_calls: "auto",
    });

    let wantsToCallFunction = chat.data.choices[0].finish_reason;
    console.log(wantsToCallFunction);
}

callChatGPTWithFunctions("Let's see if this works.");