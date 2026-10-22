FROM ubuntu:24.04
ARG TIZEN_STUDIO=6.1
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git zip unzip python3 libpython3-stdlib expect \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*
RUN userdel -r ubuntu 2>/dev/null || true; useradd -m -u 1000 tizen
USER root
COPY tools/tv-install.sh /usr/local/bin/tv-install
RUN chmod 755 /usr/local/bin/tv-install
USER tizen
WORKDIR /home/tizen
RUN curl -fsSLo cli.bin https://download.tizen.org/sdk/Installer/tizen-studio_${TIZEN_STUDIO}/web-cli_Tizen_Studio_${TIZEN_STUDIO}_ubuntu-64.bin \
    && chmod +x cli.bin && ./cli.bin --accept-license /home/tizen/tizen-studio && rm cli.bin
ENV PATH=/home/tizen/tizen-studio/tools:/home/tizen/tizen-studio/tools/ide/bin:$PATH
CMD ["sleep", "infinity"]
