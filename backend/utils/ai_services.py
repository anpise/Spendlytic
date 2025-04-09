from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains.summarize import load_summarize_chain
from langchain.docstore.document import Document
from perplexity import Client
import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import json

load_dotenv()

class AIServices:
    def __init__(self):
        # Initialize OpenAI client
        self.openai_llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.7,
            api_key=os.getenv('OPENAI_API_KEY')
        )
        
        # Initialize Perplexity client
        self.perplexity_client = Client(api_key=os.getenv('PERPLEXITY_API_KEY'))
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

        # Define function schemas for structured responses
        self.function_schemas = {
            "extract_financial_data": {
                "name": "extract_financial_data",
                "description": "Extract financial information from text",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "merchant_name": {
                            "type": "string",
                            "description": "Name of the merchant or business"
                        },
                        "total_amount": {
                            "type": "number",
                            "description": "Total amount of the transaction"
                        },
                        "date": {
                            "type": "string",
                            "description": "Date of the transaction in YYYY-MM-DD format"
                        },
                        "items": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "description": {
                                        "type": "string",
                                        "description": "Description of the item"
                                    },
                                    "quantity": {
                                        "type": "number",
                                        "description": "Quantity of the item"
                                    },
                                    "price": {
                                        "type": "number",
                                        "description": "Price of the item"
                                    }
                                }
                            }
                        }
                    },
                    "required": ["merchant_name", "total_amount", "date", "items"]
                }
            }
        }

    def openai_chat(self, prompt: str, system_message: Optional[str] = None) -> str:
        """
        Simple chat completion using OpenAI
        """
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        response = self.openai_llm.invoke(messages)
        return response.content

    def openai_summarize_text(self, text: str) -> str:
        """
        Summarize text using OpenAI
        """
        # Split text into chunks
        texts = self.text_splitter.split_text(text)
        docs = [Document(page_content=t) for t in texts]
        
        # Create summarization chain
        chain = load_summarize_chain(
            self.openai_llm,
            chain_type="map_reduce",
            verbose=True
        )
        
        return chain.run(docs)

    def openai_extract_entities(self, text: str) -> Dict[str, Any]:
        """
        Extract named entities from text using OpenAI
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful assistant that extracts named entities from text. Return the data in JSON format."),
            ("user", "Extract named entities from the following text: {text}")
        ])
        
        chain = LLMChain(llm=self.openai_llm, prompt=prompt)
        response = chain.run(text=text)
        
        try:
            return eval(response)  # Convert string to dict
        except:
            return {"error": "Failed to parse response"}

    def perplexity_chat(self, prompt: str, system_message: Optional[str] = None) -> str:
        """
        Simple chat completion using Perplexity
        """
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        response = self.perplexity_client.chat(messages=messages)
        return response.choices[0].message.content

    def perplexity_analyze_document(self, text: str) -> Dict[str, Any]:
        """
        Analyze document content using Perplexity
        """
        messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant that analyzes documents. Extract key information and provide insights."
            },
            {
                "role": "user",
                "content": f"Analyze the following document and provide key insights: {text}"
            }
        ]
        
        response = self.perplexity_client.chat(messages=messages)
        return {
            "analysis": response.choices[0].message.content,
            "model": response.model
        }

    def perplexity_extract_financial_data(self, text: str) -> Dict[str, Any]:
        """
        Extract financial data from text using Perplexity
        """
        messages = [
            {
                "role": "system",
                "content": "You are a financial data extraction assistant. Extract financial information from the text and return it in JSON format."
            },
            {
                "role": "user",
                "content": f"Extract financial data from the following text: {text}"
            }
        ]
        
        response = self.perplexity_client.chat(messages=messages)
        try:
            return eval(response.choices[0].message.content)
        except:
            return {"error": "Failed to parse financial data"}

    def compare_models(self, prompt: str) -> Dict[str, Any]:
        """
        Compare responses from both OpenAI and Perplexity
        """
        openai_response = self.openai_chat(prompt)
        perplexity_response = self.perplexity_chat(prompt)
        
        return {
            "openai": {
                "response": openai_response,
                "model": "gpt-3.5-turbo"
            },
            "perplexity": {
                "response": perplexity_response,
                "model": "pplx-7b-online"
            }
        }

    def openai_function_call(self, text: str, function_name: str) -> Dict[str, Any]:
        """
        Call OpenAI with function calling to get structured JSON response
        """
        try:
            # Get the function schema
            function_schema = self.function_schemas.get(function_name)
            if not function_schema:
                return {"error": f"Function {function_name} not found"}

            # Create the prompt
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a helpful assistant that extracts structured information from text."),
                ("user", f"Extract information from the following text using the {function_name} function: {text}")
            ])

            # Create the chain with function calling
            chain = LLMChain(
                llm=self.openai_llm,
                prompt=prompt
            )

            # Run the chain with function calling
            response = chain.run(
                text=text,
                functions=[function_schema],
                function_call={"name": function_name}
            )

            # Parse the response
            try:
                return json.loads(response)
            except:
                return {"error": "Failed to parse response as JSON"}

        except Exception as e:
            return {"error": str(e)}

    def perplexity_function_call(self, text: str, function_name: str) -> Dict[str, Any]:
        """
        Call Perplexity with function calling to get structured JSON response
        """
        try:
            # Get the function schema
            function_schema = self.function_schemas.get(function_name)
            if not function_schema:
                return {"error": f"Function {function_name} not found"}

            # Create the messages
            messages = [
                {
                    "role": "system",
                    "content": f"You are a helpful assistant that extracts structured information from text. Use the {function_name} function to format your response."
                },
                {
                    "role": "user",
                    "content": f"Extract information from the following text: {text}"
                }
            ]

            # Call Perplexity with function calling
            response = self.perplexity_client.chat(
                messages=messages,
                functions=[function_schema],
                function_call={"name": function_name}
            )

            # Parse the response
            try:
                return json.loads(response.choices[0].message.content)
            except:
                return {"error": "Failed to parse response as JSON"}

        except Exception as e:
            return {"error": str(e)}

    def compare_function_calls(self, text: str, function_name: str) -> Dict[str, Any]:
        """
        Compare function calling responses from both OpenAI and Perplexity
        """
        openai_response = self.openai_function_call(text, function_name)
        perplexity_response = self.perplexity_function_call(text, function_name)
        
        return {
            "openai": {
                "response": openai_response,
                "model": "gpt-3.5-turbo"
            },
            "perplexity": {
                "response": perplexity_response,
                "model": "pplx-7b-online"
            }
        } 