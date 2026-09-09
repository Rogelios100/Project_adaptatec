package control;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import main.ParseException;
import main.ParserConstants;
import main.Token;

public class erroresS {

    // Si CUALQUIERA de estos aparece entre los tokens esperados, se usa ese,
    // porque casi siempre es el motivo real del error (no un opcional descartado
    // durante el backtracking interno de JavaCC).
    private static final int[] PRIORIDAD = {
        ParserConstants.PUNTO_Y_COMA,
        ParserConstants.PARENTESIS_CIERRE,
        ParserConstants.LLAVE_CIERRE,
        ParserConstants.CORCHETE_CIERRE,
        ParserConstants.PARENTESIS_APERTURA,
        ParserConstants.LLAVE_APERTURA,
        ParserConstants.DOS_PUNTOS,
        ParserConstants.COMA,
        ParserConstants.IDENTIFICADOR,
    };

    private static final Map<String, String> EJEMPLOS = new HashMap<>();
    static {
        EJEMPLOS.put("PUNTO_Y_COMA", "instruccion;");
        EJEMPLOS.put("DOS_PUNTOS", "let variable: tipo = valor;");
        EJEMPLOS.put("PARENTESIS_APERTURA", "if (condicion) { ... }");
        EJEMPLOS.put("PARENTESIS_CIERRE", "if (condicion) { ... }");
        EJEMPLOS.put("LLAVE_APERTURA", "if (condicion) { ... }");
        EJEMPLOS.put("LLAVE_CIERRE", "if (condicion) { ... }");
        EJEMPLOS.put("CORCHETE_APERTURA", "let arreglo: tipo[] = [ ... ];");
        EJEMPLOS.put("CORCHETE_CIERRE", "let arreglo: tipo[] = [ ... ];");
        EJEMPLOS.put("COMA", "console.log(valor1, valor2);");
        EJEMPLOS.put("IDENTIFICADOR", "let nombreDeVariable = ...;");
        EJEMPLOS.put("OPERADOR_ASIGNACION", "variable = valor;");
        EJEMPLOS.put("OPERADOR_COMPARACION", "if (a >= b) { ... }");
        EJEMPLOS.put("OPERADOR_LOGICO", "if (a && b) { ... }");
        EJEMPLOS.put("OPERADOR_ARITMETICO", "a + b");
        EJEMPLOS.put("INCREMENTO", "contador++;");
        EJEMPLOS.put("DECREMENTO", "contador--;");
        EJEMPLOS.put("ENTERO", "let numero: number = 5;");
        EJEMPLOS.put("DECIMAL", "let numero: number = 5.5;");
        EJEMPLOS.put("CADENA", "let texto: string = \"hola\";");
        EJEMPLOS.put("TRUE", "let activo: boolean = true;");
        EJEMPLOS.put("FALSE", "let activo: boolean = false;");
        EJEMPLOS.put("LET", "let variable: tipo = valor;");
        EJEMPLOS.put("IF", "if (condicion) { ... }");
        EJEMPLOS.put("ELSE", "if (condicion) { ... } else { ... }");
        EJEMPLOS.put("FOR", "for (let i: number = 0; i < 10; i++) { ... }");
        EJEMPLOS.put("WHILE", "while (condicion) { ... }");
        EJEMPLOS.put("TIPO_NUMBER", "let variable: number = 5;");
        EJEMPLOS.put("TIPO_STRING", "let variable: string = \"texto\";");
        EJEMPLOS.put("TIPO_BOOLEAN", "let variable: boolean = true;");
        EJEMPLOS.put("TIPO_ANY", "let variable: any = valor;");
    }

    private static String nombreDeKind(int kind) {
        try {
            for (java.lang.reflect.Field field : ParserConstants.class.getFields()) {
                if (field.getType() == int.class && field.getInt(null) == kind) {
                    return field.getName();
                }
            }
        } catch (IllegalAccessException ignored) { }
        return null;
    }

    private static String tokenEsperadoPrincipal(ParseException e) {
        if (e == null || e.expectedTokenSequences == null || e.expectedTokenSequences.length == 0) {
            return null;
        }
        LinkedHashSet<Integer> esperados = new LinkedHashSet<>();
        for (int[] secuencia : e.expectedTokenSequences) {
            if (secuencia.length > 0) {
                esperados.add(secuencia[0]);
            }
        }
        for (int prioritario : PRIORIDAD) {
            if (esperados.contains(prioritario)) {
                return nombreDeKind(prioritario);
            }
        }
        return nombreDeKind(esperados.iterator().next());
    }

    public static String mensajeError(ParseException e) {
        String nombre = tokenEsperadoPrincipal(e);
        if (nombre == null) return "Error sintáctico.";
        return "Se esperaba " + nombre + ".";
    }

    public static String sintaxisEsperada(ParseException e) {
        String nombre = tokenEsperadoPrincipal(e);
        if (nombre == null) return "";
        return EJEMPLOS.getOrDefault(nombre, "");
    }

    public static String tokensEsperados(ParseException e) {
        if (e == null || e.expectedTokenSequences == null) return "";
        LinkedHashSet<String> nombres = new LinkedHashSet<>();
        for (int[] secuencia : e.expectedTokenSequences) {
            if (secuencia.length == 0) continue;
            String nombre = nombreDeKind(secuencia[0]);
            if (nombre != null) nombres.add(nombre);
        }
        return String.join(", ", nombres);
    }

    public static String descripcionAmigable(ParseException e, Token encontrado) {
        String token = encontrado == null || encontrado.kind == ParserConstants.EOF
                ? "el fin del archivo" : "el token '" + encontrado.image + "'";
        String esperado = tokensEsperados(e);
        if (esperado.contains("PUNTO_Y_COMA")) {
            return "Se esperaba terminar la instrucción con punto y coma.";
        }
        if (esperado.contains("LLAVE_APERTURA")) {
            return "Se esperaba abrir un bloque con '{'.";
        }
        if (esperado.contains("LLAVE_CIERRE")) {
            return "Se esperaba cerrar el bloque con '}'.";
        }
        return "No se esperaba " + token + " en este punto de la instrucción.";
    }
}