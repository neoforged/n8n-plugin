FROM n8nio/n8n:1.98.0
WORKDIR /home/node
USER root
COPY ./ /n8n-plugin
RUN cd /n8n-plugin && npm link
RUN cd /home/node/.n8n/custom/ && npm link neoforged-n8n-plugin
USER node
