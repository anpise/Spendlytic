from langchain_community.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import json
from config import OPENAI_API_KEY

load_dotenv()

class FinancialData(BaseModel):
    merchant_name: str = Field(description="Name of the merchant or business")
    total_amount: float = Field(description="Total amount of the transaction")
    date: str = Field(description="Date of the transaction in YYYY-MM-DD format")
    items: List[Dict[str, Any]] = Field(description="List of items purchased")

class AIServices:
    def __init__(self):
        # Initialize OpenAI client
        self.openai_client = ChatOpenAI(
            api_key=OPENAI_API_KEY,
            model="gpt-4o-mini"
        )
        
        # Initialize output parser
        self.parser = PydanticOutputParser(pydantic_object=FinancialData)
        
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

    def openai_function_call(self, text, function_name):
        """
        Call OpenAI with function calling
        """
        try:
            # Get the function schema for the requested function
            function_schema = self.function_schemas.get(function_name)
            if not function_schema:
                return {"error": f"Function {function_name} not found"}

            # Create messages with function calling and output format instructions
            messages = [
                {"role": "system", "content": "You are a financial document analyzer. Your job is to extract structured financial information from user-submitted receipts or transaction text.\n\n"
    "Use the provided function tool to return the data in the following format:\n"
    "- merchant_name: Name of the store or merchant (e.g., Walmart, Starbucks)\n"
    "- total_amount: The total amount of the transaction as a number\n"
    "- date: The date of the transaction in YYYY-MM-DD format\n"
    "- items: A list of purchased items, each with:\n"
    "    - name: Name or description of the item (e.g., 'Basmati Rice', 'Latte')\n"
    "    - quantity: Number of units purchased\n"
    "    - price: Price per unit (not total price for quantity)\n\n"
    "Ensure that you extract accurate values from the input. If something is missing or unclear, make a best guess based on typical receipts.\n\n"
    f"{self.parser.get_format_instructions()}"},
                {"role": "user", "content": text}
            ]

            # Call OpenAI with function calling
            response = self.openai_client.invoke(
                messages,
                functions=[function_schema],
                function_call={"name": function_name}
            )
            
            # Parse the response using the output parser
            try:
                # Extract the function call arguments from the response
                if hasattr(response, 'additional_kwargs') and 'function_call' in response.additional_kwargs:
                    function_args = response.additional_kwargs['function_call']['arguments']
                    # Parse the JSON string into a dictionary
                    parsed_args = json.loads(function_args)
                    # Create a FinancialData instance from the parsed arguments
                    financial_data = FinancialData(**parsed_args)
                    return financial_data.dict()
                else:
                    return {"error": "No function call found in response"}
            except Exception as e:
                return {"error": f"Failed to parse response: {str(e)}"}

        except Exception as e:
            print(f"OpenAI function call error: {str(e)}")
            return {"error": str(e)}