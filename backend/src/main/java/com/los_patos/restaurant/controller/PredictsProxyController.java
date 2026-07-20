package com.los_patos.restaurant.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collections;

@RestController
public class PredictsProxyController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String TARGET_API_URL = "http://127.0.0.1:8001/api/predicts";
    private final String TARGET_STATIC_URL = "http://127.0.0.1:8001/static/img";

    @RequestMapping(value = {
        "/api/predicts", "/api/predicts/**"
    }, method = {
        RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE,
        RequestMethod.OPTIONS, RequestMethod.PATCH
    })
    public ResponseEntity<?> proxyApi(
            @RequestBody(required = false) byte[] body,
            HttpMethod method,
            HttpServletRequest request
    ) throws URISyntaxException {
        String path = request.getRequestURI().substring(request.getContextPath().length() + "/api/predicts".length());
        String queryString = request.getQueryString();
        String url = TARGET_API_URL + path + (queryString != null ? "?" + queryString : "");
        return executeProxy(new URI(url), method, body, request);
    }

    @RequestMapping(value = {
        "/static/img/{filename:.+}"
    }, method = RequestMethod.GET)
    public ResponseEntity<?> proxyStatic(
            @PathVariable String filename,
            HttpServletRequest request
    ) throws URISyntaxException {
        String url = TARGET_STATIC_URL + "/" + filename;
        return executeProxy(new URI(url), HttpMethod.GET, null, request);
    }

    private ResponseEntity<?> executeProxy(URI uri, HttpMethod method, byte[] body, HttpServletRequest request) {
        HttpHeaders headers = new HttpHeaders();
        Collections.list(request.getHeaderNames()).forEach(headerName -> {
            if (!headerName.equalsIgnoreCase("host")) {
                headers.add(headerName, request.getHeader(headerName));
            }
        });

        HttpEntity<byte[]> httpEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(uri, method, httpEntity, byte[].class);
            return ResponseEntity.status(response.getStatusCode())
                    .headers(response.getHeaders())
                    .body(response.getBody());
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .headers(e.getResponseHeaders())
                    .body(e.getResponseBodyAsByteArray());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("detail", "Error al conectar con el servicio de predicción: " + e.getMessage()));
        }
    }
}
