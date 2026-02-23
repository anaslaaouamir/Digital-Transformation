FROM python:3.11-slim
WORKDIR /app

# Install the exact dependencies required by your prospection agent
RUN pip install flask requests python-dotenv

# Copy the Python script and templates folder (if you have one for index.html)
COPY app.py .
COPY templates/ ./templates/

EXPOSE 5000
ENTRYPOINT ["python", "app.py"]