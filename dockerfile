# Usa Node.js 20.18.0 como imagen base
FROM node:20.18.0

# Establece el directorio de trabajo en la raíz
WORKDIR /

# Copia solo package.json y package-lock.json para aprovechar la caché de Docker
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia todos los archivos del proyecto al contenedor
COPY . .

# Expone el puerto en el que corre la aplicación (ajústalo si es necesario)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "run", "start"]