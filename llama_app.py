from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import json  

app = Flask(__name__)  # Fixed __name__
CORS(app)  # Enable CORS for all origins

OLLAMA_URL = "http://localhost:11434/api/generate"  # Ollama API URL (Make sure it's running)

@app.route('/')
def index():
    return send_from_directory('.', 'llama_text.html')

@app.route('/generate', methods=['POST'])
def generate_text():
    try:
        data = request.json
        prompt = data.get('prompt', 'Hello, Llama 3!')

        payload = {"model": "llama3", "prompt": prompt}
        response = requests.post(OLLAMA_URL, json=payload, stream=True)  # Enable streaming

        if response.status_code == 200:
            generated_text = ""
            for line in response.iter_lines():
                if line:
                    try:
                        json_data = json.loads(line.decode('utf-8'))
                        generated_text += json_data.get('response', '')
                    except json.JSONDecodeError:
                        continue  # Skip malformed JSON responses

            return jsonify({'text': generated_text.strip()})  # Remove unnecessary spaces
        
        return jsonify({'error': 'Failed to generate text', 'status_code': response.status_code}), 500
    
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Could not connect to Ollama API. Make sure it is running.'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':  # Fixed __name__
    app.run(debug=True, host='0.0.0.0', port=5000)
