package control;

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
		String[] nombresLiterales = {
			"PARENTESIS_APERTURA", "PARENTESIS_CIERRE", "CORCHETE_APERTURA",
			"CORCHETE_CIERRE", "LLAVE_APERTURA", "LLAVE_CIERRE", "PUNTO_Y_COMA",
			"COMA", "PUNTO", "DOS_PUNTOS", "INTERROGACION"
		};
		int indiceLiteral = kind - ParserConstants.PARENTESIS_APERTURA;
		if (indiceLiteral >= 0 && indiceLiteral < nombresLiterales.length) {
			return nombresLiterales[indiceLiteral];
		}
		if (kind >= 0 && kind < Parser.tokenImage.length) {
			String nombre = Parser.tokenImage[kind];
			if (nombre.startsWith("<") && nombre.endsWith(">")) {
				return nombre.substring(1, nombre.length() - 1);
			}
		}
		return "ERROR_LEXICO";
	}

	public record ResultadoToken(int id, String lexema, String nombre, int linea, String descripcion) {
		public boolean esError() { return "ERROR_LEXICO".equals(nombre); }
	}
}
