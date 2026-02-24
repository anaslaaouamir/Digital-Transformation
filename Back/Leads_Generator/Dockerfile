FROM python:3.11

WORKDIR /app

RUN pip install --upgrade pip && \
    pip install --no-cache-dir --timeout=100 flask requests python-dotenv

COPY app.py .
COPY templates/ ./templates/

EXPOSE 5000
CMD ["python", "app.py"]