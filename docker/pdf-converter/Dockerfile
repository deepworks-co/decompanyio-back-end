FROM decompany/pdf-converter-base

ENV ENGINE_SRC ./POConvertLibrary_centos_x64_20191007
ENV APPLICATION_DIR /batch-application
ENV REGION us-west-1
ENV QUEUE_URL 'https://sqs.us-west-1.amazonaws.com/197966029048/asem-ca-converter'
ENV WORK_DIR_PREFIX=/cronwork
ENV EXPRESSION '*/1 * * * * *'

# Application (nodejs)
COPY ./batch-application ${APPLICATION_DIR}
#COPY ./po-converter-library_centos_x64_20190521 /converter
COPY ./POConvertLibrary_centos_x64_20191007 /converter

WORKDIR ${APPLICATION_DIR}
EXPOSE 8080
CMD ["npm", "start"]