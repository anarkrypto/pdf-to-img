# PDF-TO-IMG

Convert PDF to JPG, PNG

![PDF-TO-IMG](https://github.com/anarkrypto/pdf-to-img/assets/32111208/6652981e-7c3c-4d96-85fa-9c8b26669b13)

## Overview
This project provides a seamless, robust and scalable solution for converting PDF documents into images using customizable parameters such as quality, DPI, and image format.

It's built using **Node.js**, **MuPDF** for conversion, **RabbitMQ** for queue management, and **Docker** for containerization.

## Workflow
1. Client Request: The client sends a POST request to the API with the PDF URL, Webhook url and conversion parameters.
2. Queue Processing: The request is queued in RabbitMQ for asynchronous processing, ensuring efficient resource utilization.
3. PDF Download: The project fetches the PDF from the specified URL.
4. Identification: The PDF file is checked to ensure format compatibility and detect the number of pages
5. Conversion: Each PDF page is converted into image using MuPDF, according to the provided parameters, using all available CPU threads.
6. Upload: The resulting images are uploaded to an S3 bucket for secure and scalable storage.
7. Webhook Notification: The specified webhook URL is invoked, notifying the client of the completion of the conversion process.

## Running locally:

1. Cutomize your environments:
```
cp example.env .env
```

2. Run the container. You can use docker compose: 
```bash
docker compose up
```

3. Send your requests to
```
http://localhost:3000/convert
```

## API Usage

### Endpoint

```
POST /convert
```

### Request Body

Optional params:
- format: jpg or png. Default is jpg
- quality: 1 to 100. Default is 100. Only for jpg format
- dpi: 1 to 600. Default is 300

```json
{
  "url": "https://example.com/path/to/document.pdf",
  "format": "jpg",
  "quality": 100,
  "dpi": 300,
  "webhook": "https://client-webhook.com/notify"
}
```

### Response Body

```json
{
  "success": true,
  "convertionId": "d7f73e86-a55c-4b81-8995-4d9a9f0cbe1b"
}
```

### Webhook

```json
{
  "success": true,
  "convertionId": "d7f73e86-a55c-4b81-8995-4d9a9f0cbe1b",
  "url": "https://example.com/path/to/document.pdf",
  "format": "jpg",
  "quality": 100,
  "dpi": 300,
  "webhook": "https://client-webhook.com/notify",
  "pages": [
    {
      "url": "https://my-bucket.s3.sa-east-1.amazonaws.com/pdfs/d7f73e86-a55c-4b81-8995-4d9a9f0cbe1b/0.jpg",
      "page": 1,
      "width": 612,
      "height": 792
    },
    {
      "url": "https://my-bucket.s3.sa-east-1.amazonaws.com/pdfs/d7f73e86-a55c-4b81-8995-4d9a9f0cbe1b/1.jpg",
      "page": 2,
      "width": 612,
      "height": 792
    }
  ]
}
```

## Deployment
The entire project can be easily deployed using Docker, ensuring consistency across different environments.

## License
This project is licensed under the MIT License.

## Contributing
We welcome contributions! Please check out our [Contribution Guidelines](./CONTRIBUTING.md) for more details.


