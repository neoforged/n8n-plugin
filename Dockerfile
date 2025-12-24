FROM n8nio/n8n:1.123.7
WORKDIR /home/node
USER root
COPY ./ /n8n-plugin
RUN cd /n8n-plugin && npm link
RUN mkdir /custom-nodes && cd /custom-nodes && npm link neoforged-n8n-plugin
ENV N8N_CUSTOM_EXTENSIONS=/custom-nodes
USER node
