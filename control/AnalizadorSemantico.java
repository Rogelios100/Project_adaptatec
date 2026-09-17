package control;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import control.Control.ResultadoToken;

/** Comprueba tipos, declaraciones y llamadas del subconjunto soportado. */
final class AnalizadorSemantico {
    private static final Set<String> TIPOS_PRIMITIVOS = Set.of(
            "any", "number", "boolean", "string", "symbol", "never", "unknown", "undefined", "void");
    private static final Map<String, String> TIPOS_LITERAL = Map.of(
            "ENTERO", "number", "DECIMAL", "number", "EXPONENCIAL", "number",
            "HEXADECIMAL", "number", "BINARIO", "number", "OCTAL", "number",
            "CADENA", "string", "TRUE", "boolean", "FALSE", "boolean");

    private final List<ResultadoToken> tokens;
    private final List<Control.ResultadoSemantico> errores = new ArrayList<>();
    private final Map<String, Simbolo> simbolos = new HashMap<>();
    private final Map<String, Funcion> funciones = new HashMap<>();
    private final Set<String> tiposDeclarados = new HashSet<>();
    private final Set<Integer> posicionesDeclaracion = new HashSet<>();
    private final Set<Integer> posicionesIgnoradas = new HashSet<>();
    private final Set<Integer> declaracionesDuplicadas = new HashSet<>();

    private AnalizadorSemantico(List<ResultadoToken> tokens) {
        this.tokens = tokens;
        tiposDeclarados.addAll(TIPOS_PRIMITIVOS);
    }

    static List<Control.ResultadoSemantico> analizar(List<ResultadoToken> tokens) {
        AnalizadorSemantico analizador = new AnalizadorSemantico(tokens);
        analizador.registrarDeclaraciones();
        analizador.validarPrograma();
        return analizador.errores;
    }

    private void registrarDeclaraciones() {
        for (int indice = 0; indice < tokens.size(); indice++) {
            String nombre = tokens.get(indice).nombre();
            if (esDeclaracion(nombre)) registrarVariable(indice);
            else if ("FUNCTION".equals(nombre)) registrarFuncion(indice);
            else if ("CLASS".equals(nombre) || "INTERFACE".equals(nombre) || "ENUM".equals(nombre)) {
                registrarTipo(indice);
            }
        }
    }

    private void registrarVariable(int indice) {
        if (!esIdentificador(indice + 1)) return;
        ResultadoToken nombre = tokens.get(indice + 1);
        posicionesDeclaracion.add(indice);
        posicionesDeclaracion.add(indice + 1);
        String tipo = null;
        int cursor = indice + 2;
        if (es(cursor, "DOS_PUNTOS")) {
            tipo = tipoEn(cursor + 1);
            posicionesIgnoradas.add(cursor + 1);
            cursor += 2;
        }
        if (simbolos.containsKey(nombre.lexema())) {
            error(nombre, "La variable '" + nombre.lexema() + "' ya fue declarada.");
            declaracionesDuplicadas.add(indice);
        } else {
            simbolos.put(nombre.lexema(), new Simbolo(tipo, "CONST".equals(tokens.get(indice).nombre())));
        }
        validarTipoDeclarado(tipo, token(cursor - 1));
    }

    private void registrarFuncion(int indice) {
        if (!esIdentificador(indice + 1)) return;
        ResultadoToken nombre = tokens.get(indice + 1);
        int apertura = buscar(indice + 2, "PARENTESIS_APERTURA");
        int cierre = pareja(apertura, "PARENTESIS_APERTURA", "PARENTESIS_CIERRE");
        if (apertura < 0 || cierre < 0) return;
        List<Parametro> parametros = new ArrayList<>();
        for (int cursor = apertura + 1; cursor < cierre;) {
            if (!esIdentificador(cursor)) { cursor++; continue; }
            ResultadoToken parametro = tokens.get(cursor++);
            String tipo = "any";
            if (es(cursor, "DOS_PUNTOS")) {
                tipo = tipoEn(cursor + 1);
                posicionesIgnoradas.add(cursor + 1);
                cursor += 2;
            }
            parametros.add(new Parametro(parametro.lexema(), tipo));
            simbolos.putIfAbsent(parametro.lexema(), new Simbolo(tipo, false));
            posicionesIgnoradas.add(cursor - 1);
            while (cursor < cierre && !es(cursor, "COMA")) cursor++;
            if (es(cursor, "COMA")) cursor++;
        }
        int cursor = cierre + 1;
        String retorno = "void";
        if (es(cursor, "DOS_PUNTOS")) {
            retorno = tipoEn(cursor + 1);
            posicionesIgnoradas.add(cursor + 1);
        }
        int cuerpo = buscar(cursor, "LLAVE_APERTURA");
        int finCuerpo = pareja(cuerpo, "LLAVE_APERTURA", "LLAVE_CIERRE");
        funciones.put(nombre.lexema(), new Funcion(parametros, retorno, cuerpo, finCuerpo));
        tiposDeclarados.add(nombre.lexema());
        posicionesDeclaracion.add(indice);
        posicionesDeclaracion.add(indice + 1);
        validarTipoDeclarado(retorno, token(cursor + 1));
    }

    private void registrarTipo(int indice) {
        if (!esIdentificador(indice + 1)) return;
        ResultadoToken nombre = tokens.get(indice + 1);
        if (!tiposDeclarados.add(nombre.lexema())) {
            error(nombre, "El tipo '" + nombre.lexema() + "' ya fue declarado.");
        }
        posicionesDeclaracion.add(indice);
        posicionesDeclaracion.add(indice + 1);
        if ("CLASS".equals(tokens.get(indice).nombre()) && es(indice + 2, "EXTENDS")) {
            ResultadoToken padre = token(indice + 3);
            if (padre != null && !tiposDeclarados.contains(padre.lexema())) {
                error(padre, "La clase base '" + padre.lexema() + "' no ha sido declarada.");
            }
            posicionesIgnoradas.add(indice + 3);
        }
    }

    private void validarPrograma() {
        for (int indice = 0; indice < tokens.size(); indice++) {
            if (posicionesIgnoradas.contains(indice)) continue;
            if (esTipoDeclarado(indice)) continue;
            ResultadoToken token = tokens.get(indice);
            if (esDeclaracion(token.nombre())) validarDeclaracion(indice);
            else if ("OPERADOR_ASIGNACION".equals(token.nombre())) validarAsignacion(indice);
            else if ("INCREMENTO".equals(token.nombre()) || "DECREMENTO".equals(token.nombre())) {
                validarIncremento(indice);
            } else if (esIdentificador(indice) && es(indice + 1, "PARENTESIS_APERTURA")) {
                validarLlamada(indice);
            } else if ("RETURN".equals(token.nombre())) validarRetorno(indice);
        }
    }

    private void validarDeclaracion(int indice) {
        if (!esIdentificador(indice + 1)) return;
        if (declaracionesDuplicadas.contains(indice)) return;
        int inicio = indice + 2;
        if (es(inicio, "DOS_PUNTOS")) inicio += 2;
        if (!es(inicio, "OPERADOR_ASIGNACION")) return;
        int fin = finDeSentencia(inicio + 1);
        String tipo = tipoExpresion(inicio + 1, fin, new HashSet<>());
        Simbolo simbolo = simbolos.get(tokens.get(indice + 1).lexema());
        if (simbolo != null && tiposDeclarados.contains(simbolo.tipo) && !compatible(simbolo.tipo, tipo)) {
            error(tokens.get(indice + 1), "El valor asignado es de tipo '" + tipo
                    + "' y la variable espera '" + simbolo.tipo + "'.");
        }
    }

    private void validarAsignacion(int indice) {
        ResultadoToken objetivo = token(indice - 1);
        if (!esIdentificador(indice - 1) || posicionesDeclaracion.contains(indice - 1)
            || es(indice - 2, "DOS_PUNTOS")) return;
        Simbolo simbolo = simbolos.get(objetivo.lexema());
        if (simbolo == null) {
            error(objetivo, "La variable '" + objetivo.lexema() + "' no ha sido declarada.");
            return;
        }
        if (simbolo.constante) error(objetivo, "La constante '" + objetivo.lexema() + "' no puede reasignarse.");
        int fin = finDeSentencia(indice + 1);
        String tipo = tipoExpresion(indice + 1, fin, new HashSet<>());
        if (tiposDeclarados.contains(simbolo.tipo) && !compatible(simbolo.tipo, tipo)) {
            error(objetivo, "El valor asignado es de tipo '" + tipo
                    + "' y la variable espera '" + simbolo.tipo + "'.");
        }
    }

    private void validarIncremento(int indice) {
        ResultadoToken objetivo = token(indice - 1);
        if (!esIdentificador(indice - 1)) return;
        Simbolo simbolo = simbolos.get(objetivo.lexema());
        if (simbolo == null) error(objetivo, "La variable '" + objetivo.lexema() + "' no ha sido declarada.");
        else if (!"number".equals(simbolo.tipo) && !"any".equals(simbolo.tipo)) {
            error(objetivo, "El operador de incremento solo puede usarse con 'number'.");
        }
    }

    private void validarLlamada(int indice) {
        ResultadoToken nombre = tokens.get(indice);
        Funcion funcion = funciones.get(nombre.lexema());
        int cierre = pareja(indice + 1, "PARENTESIS_APERTURA", "PARENTESIS_CIERRE");
        if (funcion == null || cierre < 0) return;
        List<int[]> argumentos = segmentos(indice + 2, cierre);
        if (argumentos.size() != funcion.parametros.size()) {
            error(nombre, "La función '" + nombre.lexema() + "' espera "
                    + funcion.parametros.size() + " argumento(s), pero recibió " + argumentos.size() + ".");
        }
        int limite = Math.min(argumentos.size(), funcion.parametros.size());
        for (int posicion = 0; posicion < limite; posicion++) {
            int[] argumento = argumentos.get(posicion);
            String tipo = tipoExpresion(argumento[0], argumento[1], new HashSet<>());
            String esperado = funcion.parametros.get(posicion).tipo;
            if (!compatible(esperado, tipo)) {
                error(tokens.get(argumento[0]), "El argumento " + (posicion + 1) + " de '" + nombre.lexema()
                        + "' es de tipo '" + tipo + "' y se esperaba '" + esperado + "'.");
            }
        }
    }

    private void validarRetorno(int indice) {
        Funcion funcion = funcionContenedora(indice);
        if (funcion == null) return;
        int fin = finDeSentencia(indice + 1);
        String tipo = tipoExpresion(indice + 1, fin, new HashSet<>());
        if (!compatible(funcion.retorno, tipo) || ("void".equals(funcion.retorno) && tipo != null)) {
            error(tokens.get(indice), "La función retorna '" + tipo + "', pero debe retornar '"
                    + funcion.retorno + "'.");
        }
    }

    private String tipoExpresion(int inicio, int fin, Set<Integer> visitados) {
        if (inicio >= fin) return "void";
        for (int indice = inicio; indice < fin; indice++) {
            if (visitados.add(indice) && esIdentificador(indice) && !posicionesIgnoradas.contains(indice)
                    && !es(indice + 1, "PARENTESIS_APERTURA")) {
                String lexema = tokens.get(indice).lexema();
                if (!simbolos.containsKey(lexema) && !funciones.containsKey(lexema)
                    && !esClaveObjeto(indice) && !esTipoDeclarado(indice)
                    && !tiposDeclarados.contains(lexema)) {
                    error(tokens.get(indice), "El identificador '" + lexema + "' no ha sido declarado.");
                }
            }
        }
        for (int indice = inicio; indice < fin; indice++) {
            if (es(indice, "OPERADOR_ARITMETICO")) {
                String izquierdo = tipoExpresion(inicio, indice, new HashSet<>());
                String derecho = tipoExpresion(indice + 1, fin, new HashSet<>());
                if ("unknown".equals(izquierdo) || "unknown".equals(derecho)) return "unknown";
                if (!"number".equals(izquierdo) || !"number".equals(derecho)) {
                    error(tokens.get(indice), "Los operadores aritméticos requieren operandos de tipo 'number'.");
                    return "number";
                }
            }
        }
        String literal = primerTipoLiteral(inicio, fin);
        if (literal != null) return literal;
        for (int indice = inicio; indice < fin; indice++) {
            if (esIdentificador(indice) && simbolos.containsKey(tokens.get(indice).lexema())) {
                return simbolos.get(tokens.get(indice).lexema()).tipo;
            }
        }
        if (es(inicio, "LLAVE_APERTURA")) return "object";
        return "unknown";
    }

    private String primerTipoLiteral(int inicio, int fin) {
        for (int indice = inicio; indice < fin; indice++) {
            String tipo = TIPOS_LITERAL.get(tokens.get(indice).nombre());
            if (tipo != null) return tipo;
        }
        return null;
    }

    private boolean esClaveObjeto(int indice) {
        return es(indice + 1, "DOS_PUNTOS") && (indice == 0 || es(indice - 1, "LLAVE_APERTURA")
                || es(indice - 1, "COMA"));
    }

    private boolean esTipoDeclarado(int indice) {
        return es(indice - 1, "DOS_PUNTOS") && (indice == 0 || !es(indice - 2, "LLAVE_APERTURA"));
    }

    private Funcion funcionContenedora(int indice) {
        for (Funcion funcion : funciones.values()) {
            if (funcion.cuerpo >= 0 && indice > funcion.cuerpo && indice < funcion.finCuerpo) return funcion;
        }
        return null;
    }

    private boolean compatible(String esperado, String actual) {
        return esperado == null || "any".equals(esperado) || "unknown".equals(actual) || esperado.equals(actual);
    }

    private void validarTipoDeclarado(String tipo, ResultadoToken referencia) {
        if (tipo != null && !tiposDeclarados.contains(tipo) && referencia != null) {
            error(referencia, "El tipo '" + tipo + "' no ha sido declarado.");
        }
    }

    private int finDeSentencia(int inicio) {
        int parentesis = 0, corchetes = 0, llaves = 0;
        for (int indice = inicio; indice < tokens.size(); indice++) {
            String nombre = tokens.get(indice).nombre();
            if ("PARENTESIS_APERTURA".equals(nombre)) parentesis++;
            if ("PARENTESIS_CIERRE".equals(nombre)) parentesis--;
            if ("CORCHETE_APERTURA".equals(nombre)) corchetes++;
            if ("CORCHETE_CIERRE".equals(nombre)) corchetes--;
            if ("LLAVE_APERTURA".equals(nombre)) llaves++;
            if ("LLAVE_CIERRE".equals(nombre)) {
                if (parentesis == 0 && corchetes == 0 && llaves == 0) return indice;
                llaves--;
            }
            if ("PUNTO_Y_COMA".equals(nombre) && parentesis == 0 && corchetes == 0 && llaves == 0) return indice;
                if (parentesis == 0 && corchetes == 0 && llaves == 0
                    && ("LET".equals(nombre) || "CONST".equals(nombre) || "VAR".equals(nombre))) return indice;
        }
        return tokens.size();
    }

    private int pareja(int inicio, String apertura, String cierre) {
        if (inicio < 0 || inicio >= tokens.size() || !es(inicio, apertura)) return -1;
        int profundidad = 0;
        for (int indice = inicio; indice < tokens.size(); indice++) {
            if (es(indice, apertura)) profundidad++;
            if (es(indice, cierre) && --profundidad == 0) return indice;
        }
        return -1;
    }

    private List<int[]> segmentos(int inicio, int fin) {
        List<int[]> resultado = new ArrayList<>();
        int comienzo = inicio, profundidad = 0;
        for (int indice = inicio; indice < fin; indice++) {
            if (es(indice, "PARENTESIS_APERTURA") || es(indice, "LLAVE_APERTURA") || es(indice, "CORCHETE_APERTURA")) profundidad++;
            if (es(indice, "PARENTESIS_CIERRE") || es(indice, "LLAVE_CIERRE") || es(indice, "CORCHETE_CIERRE")) profundidad--;
            if (es(indice, "COMA") && profundidad == 0) {
                if (comienzo < indice) resultado.add(new int[]{comienzo, indice});
                comienzo = indice + 1;
            }
        }
        if (comienzo < fin) resultado.add(new int[]{comienzo, fin});
        return resultado;
    }

    private int buscar(int inicio, String nombre) {
        for (int indice = Math.max(0, inicio); indice < tokens.size(); indice++) if (es(indice, nombre)) return indice;
        return -1;
    }

    private String tipoEn(int indice) {
        ResultadoToken token = token(indice);
        return token == null ? null : token.lexema();
    }

    private boolean esDeclaracion(String nombre) {
        return "LET".equals(nombre) || "CONST".equals(nombre) || "VAR".equals(nombre);
    }

    private boolean esIdentificador(int indice) {
        return es(indice, "IDENTIFICADOR");
    }

    private boolean es(int indice, String nombre) {
        return indice >= 0 && indice < tokens.size() && nombre.equals(tokens.get(indice).nombre());
    }

    private ResultadoToken token(int indice) {
        return indice >= 0 && indice < tokens.size() ? tokens.get(indice) : null;
    }

    private void error(ResultadoToken token, String descripcion) {
        if (token == null) return;
        for (Control.ResultadoSemantico existente : errores) {
            if (existente.linea() == token.linea() && existente.columna() == token.columna()
                    && existente.descripcion().equals(descripcion)) return;
        }
        errores.add(new Control.ResultadoSemantico(token.linea(), token.columna(), "ERROR", descripcion));
    }

    private record Simbolo(String tipo, boolean constante) { }
    private record Parametro(String nombre, String tipo) { }
    private record Funcion(List<Parametro> parametros, String retorno, int cuerpo, int finCuerpo) { }
}
