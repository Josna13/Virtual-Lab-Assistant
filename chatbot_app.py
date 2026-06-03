from flask import Flask, request, jsonify, render_template
import google.generativeai as genai
from flask_cors import CORS

app = Flask(__name__, template_folder=".")

CORS(app)

# Set up API key
genai.configure(api_key="AIzaSyDmq7p352Fp28vWxtWjOBk6IFuYERnPtqo")

# Initialize the model
model = genai.GenerativeModel("gemini-pro")

# 🛠 Add this route to serve index.html
@app.route('/')
def home():
    return render_template("index.html")

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get("message", "")

    if not user_input:
        return jsonify({"error": "Empty message"}), 400

    try:
        response = model.generate_content(user_input)
        
        # Check if response contains code (adjust based on actual responses)
        if "public class" in response.text or "#include" in response.text:
            formatted_response = f"```java\n{response.text}\n```"
        else:
            formatted_response = response.text

        return jsonify({"response": formatted_response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
