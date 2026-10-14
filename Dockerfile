# Extrem leichtgewichtiger Nginx Alpine Webserver (< 20 MB)
FROM nginx:alpine

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy custom optimized Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all application assets
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY sw.js /usr/share/nginx/html/
COPY manifest.json /usr/share/nginx/html/
COPY icon.svg /usr/share/nginx/html/
COPY icon-192.png /usr/share/nginx/html/
COPY icon-512.png /usr/share/nginx/html/
COPY apple-touch-icon.png /usr/share/nginx/html/
COPY tesseract.min.js /usr/share/nginx/html/

# Expose standard HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
