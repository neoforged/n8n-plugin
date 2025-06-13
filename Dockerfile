FROM n8nio/n8n:1.98.0
USER root
COPY dist/credentials /home/node/.n8n/custom
COPY dist/nodes /home/node/.n8n/custom
USER node
WORKDIR /home/node
