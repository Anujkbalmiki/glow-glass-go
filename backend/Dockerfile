FROM golang:1.22-alpine AS build

WORKDIR /src
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/qpayslip-api ./cmd/api

FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=build /out/qpayslip-api /qpayslip-api
ENV HTTP_ADDR=:8080
EXPOSE 8080
ENTRYPOINT ["/qpayslip-api"]
