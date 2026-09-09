package control;
//
import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import main.ParseException;
import main.Parser;
import main.ParserConstants;
import main.ParserTokenManager;
import main.SimpleCharStream;
import main.Token;
import ui.Ide;


public class Control {
	public void iniciarAplicacion() {
		Ide.mostrar(this);
	}

	public List<ResultadoToken> analizarLexico(String codigo) throws IOException {
		List<ResultadoToken> resultados = new ArrayList<>();
		try (Reader reader = new StringReader(codigo == null ? "" : codigo)) {
			ParserTokenManager lexer = new ParserTokenManager(new SimpleCharStream(reader));
			Token token;
			int id = 1;
			try {
				while ((token = lexer.getNextToken()).kind != ParserConstants.EOF) {
					String nombre = nombreToken(token.kind);
					String descripcion = "ERROR_LEXICO".equals(nombre)
							? Parser.descripcionErrorLexico(token) : "";
					resultados.add(new ResultadoToken(id++, token.image, nombre, token.beginLine,
							token.beginColumn, descripcion));
				}
			} catch (main.TokenMgrError error) {
				int[] posicion = posicionErrorLexico(error.getMessage());
				resultados.add(new ResultadoToken(id, "?", "ERROR_LEXICO", posicion[0],
						posicion[1], "Símbolo no reconocido."));
			}
		}
		return resultados;
	}

	private int[] posicionErrorLexico(String mensaje) {
		if (mensaje != null) {
			java.util.regex.Matcher matcher = java.util.regex.Pattern
					.compile("line (\\d+), column (\\d+)").matcher(mensaje);
			if (matcher.find()) {
				return new int[] {Integer.parseInt(matcher.group(1)), Integer.parseInt(matcher.group(2))};
			}
		}
		return new int[] {-1, -1};
	}

	public String abrirArchivo(Path archivo) throws IOException {
		return Files.readString(archivo, StandardCharsets.UTF_8);
	}

	public void guardarArchivo(Path archivo, String contenido) throws IOException {
		Files.writeString(archivo, contenido == null ? "" : contenido, StandardCharsets.UTF_8);
	}

	public void exportarTabla(Path archivo, List<ResultadoToken> tokens) throws IOException {
		StringBuilder salida = new StringBuilder("ID\tLEXEMA\tTOKEN\n");
		for (ResultadoToken token : tokens) {
			salida.append(token.id()).append('\t')
					.append(token.lexema()).append('\t')
					.append(token.nombre()).append('\n');
		}
		guardarArchivo(archivo, salida.toString());
	}

	public void exportarTablaSintactica(Path archivo, List<ResultadoSintactico> errores) throws IOException {
		StringBuilder salida = new StringBuilder("LÍNEA\tCOLUMNA\tENCONTRADO\tESPERADOS\tDESCRIPCIÓN\n");
		for (ResultadoSintactico error : errores) {
			salida.append(error.linea()).append('\t')
					.append(error.columna()).append('\t')
					.append(error.encontrado()).append('\t')
					.append(error.esperados()).append('\t')
					.append(error.descripcion()).append('\n');
		}
		guardarArchivo(archivo, salida.toString());
	}

private String nombreToken(int kind) {
	try {
		for (java.lang.reflect.Field field : ParserConstants.class.getFields()) {
			if (field.getType() == int.class && field.getInt(null) == kind) {
				return field.getName();
			}
		}
	} catch (IllegalAccessException ignored) { }
	return "ERROR_LEXICO";
}

	public record ResultadoToken(int id, String lexema, String nombre, int linea, int columna, String descripcion) {
		public boolean esError() { return "ERROR_LEXICO".equals(nombre); }
	}

	public record ResultadoSintactico(int linea, int columna, String encontrado,
			String esperados, String descripcion) {}

	public List<ResultadoSintactico> analizarSintactico(String codigo, List<ResultadoToken> tokens) {
		List<ResultadoSintactico> errores = new ArrayList<>();
		if (tokens.stream().anyMatch(ResultadoToken::esError)) return errores;
		Parser parser = new Parser(new StringReader(codigo == null ? "" : codigo));
		try {
			parser.Inicio();
		} catch (ParseException e) {
			Token t = e.currentToken;
			int linea = (t != null) ? t.endLine : -1;
			errores.add(new ResultadoSintactico(linea, t != null ? t.endColumn : -1,
					t != null ? t.image : "fin de archivo", erroresS.tokensEsperados(e),
					erroresS.descripcionAmigable(e, t)));
		}
		for (String[] err : parser.erroresSintacticos) {
			errores.add(new ResultadoSintactico(Integer.parseInt(err[0]), Integer.parseInt(err[1]),
					err[2], err[3], err[4]));
		}
		return errores;
	}
}
