FROM n8nio/n8n:1.98.0
USER root
COPY ./ /home/node/.n8n/custom/node_modules/neoforged-n8n-plugin
USER node
WORKDIR /home/node
