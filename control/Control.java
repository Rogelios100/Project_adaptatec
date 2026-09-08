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
import main.Parser;
import main.ParserConstants;
import main.ParserTokenManager;
import main.SimpleCharStream;
import main.Token;
import ui.Ide;
import main.ParseException;


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
			while ((token = lexer.getNextToken()).kind != ParserConstants.EOF) {
				String nombre = nombreToken(token.kind);
				String descripcion = "ERROR_LEXICO".equals(nombre)
						? Parser.descripcionErrorLexico(token) : "";
				resultados.add(new ResultadoToken(id++, token.image, nombre, token.beginLine,
						descripcion));
				//System.out.println("kind=" + token.kind + " image='" + token.image + "' tokenImage=" + Parser.tokenImage[token.kind]);
			}
		}
		return resultados;
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

	public record ResultadoToken(int id, String lexema, String nombre, int linea, String descripcion) {
		public boolean esError() { return "ERROR_LEXICO".equals(nombre); }
	}

	public record ResultadoSintactico(int linea, int columna, String mensaje) {}

	public List<ResultadoSintactico> analizarSintactico(String codigo) {
		List<ResultadoSintactico> errores = new ArrayList<>();
		Parser parser = new Parser(new StringReader(codigo == null ? "" : codigo));
		try {
			parser.Inicio();
		} catch (ParseException e) {
			Token t = (e.currentToken != null && e.currentToken.next != null)
					? e.currentToken.next : e.currentToken;
			int linea = (t != null) ? t.beginLine : -1;
			int columna = (t != null) ? t.beginColumn : -1;
			errores.add(new ResultadoSintactico(linea, columna, e.getMessage()));
		}
		for (String[] err : parser.erroresSintacticos) {
			errores.add(new ResultadoSintactico(Integer.parseInt(err[0]), Integer.parseInt(err[1]), err[2]));
		}
		return errores;
	}
}
