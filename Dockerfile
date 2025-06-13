FROM n8nio/n8n:1.98.0
USER root
COPY dist/credentials/ /home/node/.n8n/custom/credentials/
COPY dist/nodes/ /home/node/.n8n/custom/nodes/
USER node
WORKDIR /home/node
