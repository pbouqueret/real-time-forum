package main

import (
    "log"
    "net/http"
    "os"
)

func main() {
    port := "8080"
    if envPort := os.Getenv("PORT"); envPort != "" {
        port = envPort
    }

    fs := http.FileServer(http.Dir("./static"))
    http.Handle("/", fs)

    log.Printf("Server starting on http://localhost:%s", port)
    err := http.ListenAndServe(":"+port, nil)
    if err != nil {
        log.Fatal(err)
    }
}
