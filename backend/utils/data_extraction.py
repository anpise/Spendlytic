import boto3
import os
from botocore.exceptions import ClientError
from config import AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
from utils.ai_services import AIServices
import uuid
import datetime

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

    @staticmethod
    def upload_image_to_s3(image_path, bucket_name, user_id, content_type="image/jpeg", folder="uploads"):
        """
        Uploads an image file to an S3 bucket.
        Args:
            image_path: Path to the image file
            bucket_name: The S3 bucket name
            user_id: The user ID to include in the filename
            content_type: The MIME type of the image (default: 'image/jpeg')
            folder: The S3 folder path (default: 'uploads')
        Returns:
            The S3 key if upload is successful, else None.
        """
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{user_id}_{timestamp}_{uuid.uuid4()}.jpg"
        s3_key = f"{folder}/{unique_filename}"
        s3 = boto3.client('s3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        try:
            with open(image_path, 'rb') as img_file:
                s3.put_object(
                    Bucket=bucket_name,
                    Key=s3_key,
                    Body=img_file,
                    ContentType=content_type
                )
            return s3_key
        except (ClientError, Exception) as e:
            print(f"Error uploading to S3: {e}")
            return None

    @staticmethod
    def generate_presigned_url(bucket_name, object_key, expiration=300):
        """
        Generate a presigned URL to share an S3 object
        Args:
            bucket_name: S3 bucket name
            object_key: S3 object key
            expiration: Time in seconds for the presigned URL to remain valid
        Returns:
            Presigned URL as string. If error, returns None.
        """
        # Enforce guardrail: Max 10 minutes (600 seconds) for security
        expiration = min(expiration, 600)
        s3 = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        try:
            response = s3.generate_presigned_url('get_object',
                                                Params={'Bucket': bucket_name,
                                                        'Key': object_key},
                                                ExpiresIn=expiration)
        except Exception as e:
            print(f"Error generating presigned URL: {e}")
            return None
        return response 