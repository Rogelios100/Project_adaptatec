package control;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import control.Control.ResultadoToken;

/** Comprueba las reglas semánticas básicas del subconjunto soportado. */
final class AnalizadorSemantico {
    private static final Map<String, String> TIPOS_LITERAL = Map.of(
            "ENTERO", "number", "DECIMAL", "number", "EXPONENCIAL", "number",
            "HEXADECIMAL", "number", "BINARIO", "number", "OCTAL", "number",
            "CADENA", "string", "TRUE", "boolean", "FALSE", "boolean");

    private final List<ResultadoToken> tokens;
    private final List<Control.ResultadoSemantico> errores = new ArrayList<>();
    private final Map<String, Simbolo> simbolos = new HashMap<>();

    private AnalizadorSemantico(List<ResultadoToken> tokens) {
        this.tokens = tokens;
    }

    static List<Control.ResultadoSemantico> analizar(List<ResultadoToken> tokens) {
        AnalizadorSemantico analizador = new AnalizadorSemantico(tokens);
        analizador.ejecutar();
        return analizador.errores;
    }

    private void ejecutar() {
        for (int indice = 0; indice < tokens.size(); indice++) {
            ResultadoToken token = tokens.get(indice);
            if (esDeclaracion(token)) {
                indice = analizarDeclaracion(indice);
            } else if ("FUNCTION".equals(token.nombre()) || "CLASS".equals(token.nombre())
                    || "INTERFACE".equals(token.nombre()) || "ENUM".equals(token.nombre())) {
                indice = registrarTipoNombrado(indice);
            } else if ("OPERADOR_ASIGNACION".equals(token.nombre())) {
                verificarAsignacion(indice);
            }
        }
    }

    private int analizarDeclaracion(int indice) {
        if (indice + 1 >= tokens.size() || !esIdentificador(tokens.get(indice + 1))) return indice;

        ResultadoToken nombre = tokens.get(indice + 1);
        if (simbolos.containsKey(nombre.lexema())) {
            error(nombre, "La variable '" + nombre.lexema() + "' ya fue declarada.");
        }

        String tipo = null;
        int cursor = indice + 2;
        if (cursor + 1 < tokens.size() && "DOS_PUNTOS".equals(tokens.get(cursor).nombre())) {
            tipo = tipoToken(tokens.get(cursor + 1));
            cursor += 2;
        }
        int fin = cursor;
        while (fin < tokens.size() && !"PUNTO_Y_COMA".equals(tokens.get(fin).nombre())) fin++;
        String tipoInferido = tipoLiteral(cursor, fin);
        if (tipo != null && tipoInferido != null && !tipo.equals(tipoInferido) && !"any".equals(tipo)) {
            error(nombre, "El valor asignado es de tipo '" + tipoInferido
                    + "' y la variable espera '" + tipo + "'.");
        }
        simbolos.putIfAbsent(nombre.lexema(), new Simbolo(tipo == null ? tipoInferido : tipo));
        return Math.max(indice, fin - 1);
    }

    private int registrarTipoNombrado(int indice) {
        if (indice + 1 >= tokens.size() || !esIdentificador(tokens.get(indice + 1))) return indice;
        ResultadoToken nombre = tokens.get(indice + 1);
        if (simbolos.containsKey(nombre.lexema())) {
            error(nombre, "El identificador '" + nombre.lexema() + "' ya fue declarado.");
        } else {
            simbolos.put(nombre.lexema(), new Simbolo("declarado"));
        }
        return indice + 1;
    }

    private void verificarAsignacion(int indice) {
        if (indice == 0) return;
        ResultadoToken nombre = tokens.get(indice - 1);
        if (esIdentificador(nombre) && !simbolos.containsKey(nombre.lexema())) {
            error(nombre, "La variable '" + nombre.lexema() + "' no ha sido declarada.");
        }
    }

    private String tipoLiteral(int inicio, int fin) {
        for (int indice = inicio; indice < fin; indice++) {
            String tipo = TIPOS_LITERAL.get(tokens.get(indice).nombre());
            if (tipo != null) return tipo;
        }
        return null;
    }

    private String tipoToken(ResultadoToken token) {
        if (token == null) return null;
        if (token.nombre().startsWith("TIPO_")) return token.lexema();
        return token.lexema();
    }

    private boolean esDeclaracion(ResultadoToken token) {
        return "LET".equals(token.nombre()) || "CONST".equals(token.nombre())
                || "VAR".equals(token.nombre());
    }

    private boolean esIdentificador(ResultadoToken token) {
        return token != null && "IDENTIFICADOR".equals(token.nombre());
    }

    private void error(ResultadoToken token, String descripcion) {
        errores.add(new Control.ResultadoSemantico(token.linea(), token.columna(), "ERROR", descripcion));
    }

    private record Simbolo(String tipo) { }
}