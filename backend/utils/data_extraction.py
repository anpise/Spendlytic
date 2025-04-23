import boto3
import os
from botocore.exceptions import ClientError
from config import AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
from utils.ai_services import AIServices

class DataExtractor:
    def __init__(self):
        self.textract = boto3.client(
            'textract',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        self.ai_services = AIServices()

    def extract_text_from_file(self, file_path):
        """
        Extract text from a file using AWS Textract and analyze with Perplexity
        """
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")

            # Read the file
            with open(file_path, 'rb') as file:
                file_bytes = file.read()

            # Call Textract
            response = self.textract.detect_document_text(
                Document={'Bytes': file_bytes}
            )

            # Extract text from response
            extracted_text = ""
            for item in response.get('Blocks', []):
                if item['BlockType'] == 'LINE':
                    extracted_text += item['Text'] + '\n'

            extracted_text = extracted_text.strip()

            # Analyze text with Perplexity using function calling
            analysis = self.ai_services.openai_function_call(
                text=extracted_text,
                function_name='extract_financial_data'
            )

            return {
                'extracted_text': extracted_text,
                'analysis': analysis
            }

        except ClientError as e:
            print(f"AWS Error: {str(e)}")
            raise Exception(f"AWS Textract error: {str(e)}")
        except Exception as e:
            print(f"Error processing text: {str(e)}")
            raise Exception(f"Error processing text: {str(e)}")

    def extract_text_from_s3(self, bucket_name, object_key):
        """
        Extract text from a file in S3 using AWS Textract and analyze with Perplexity
        """
        try:
            response = self.textract.detect_document_text(
                Document={
                    'S3Object': {
                        'Bucket': bucket_name,
                        'Name': object_key
                    }
                }
            )

            # Extract text from response
            extracted_text = ""
            for item in response.get('Blocks', []):
                if item['BlockType'] == 'LINE':
                    extracted_text += item['Text'] + '\n'

            extracted_text = extracted_text.strip()

            # Analyze text with Perplexity using function calling
            analysis = self.ai_services.perplexity_function_call(
                text=extracted_text,
                function_name='extract_financial_data'
            )

            return {
                'extracted_text': extracted_text,
                'analysis': analysis
            }

        except ClientError as e:
            print(f"AWS Error: {str(e)}")
            raise Exception(f"AWS Textract error: {str(e)}")
        except Exception as e:
            print(f"Error processing text: {str(e)}")
            raise Exception(f"Error processing text: {str(e)}") 