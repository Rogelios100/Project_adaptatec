package ui;

import control.Control;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.Insets;
import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSplitPane;
import javax.swing.JTabbedPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.JTextPane;
import javax.swing.JToolBar;
import javax.swing.ListSelectionModel;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.UnsupportedLookAndFeelException;
import javax.swing.border.EmptyBorder;
import javax.swing.event.CaretEvent;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import javax.swing.text.BadLocationException;
import javax.swing.text.DefaultHighlighter;
import javax.swing.text.Element;
import javax.swing.text.JTextComponent;
import javax.swing.text.Style;
import javax.swing.text.StyleConstants;
import javax.swing.text.StyledDocument;

public class Ide extends JFrame {
	private static final int TAB_LEXICO = 0;
	private static final int TAB_SINTACTICO = 1;
	private static final int TAB_SEMANTICO = 2;
	private static final Color NAVY = new Color(31, 41, 55);
	private static final Color PANEL = new Color(248, 250, 252);
	private static final Color BORDER = new Color(226, 232, 240);
	private static final Color MUTED = new Color(100, 116, 139);

	private final JTextPane editor = new JTextPane() {
		@Override
		public boolean getScrollableTracksViewportWidth() {
			return false;
		}
	};
	private final JTextArea console = new JTextArea();
	private final DefaultTableModel tokenModel = new DefaultTableModel(new Object[] {"ID", "LEXEMA", "TOKEN"}, 0) {
		@Override public boolean isCellEditable(int row, int column) { return false; }
	};
	private final JTable tokenTable = new JTable(tokenModel);
	private final JLabel position = new JLabel("Línea: 1    Columna: 1");
	private final JLabel fileLabel = new JLabel("Sin archivo");
	private final Control control;

private final DefaultTableModel syntaxModel = new DefaultTableModel(new Object[] {"LÍNEA", "COLUMNA", "ENCONTRADO", "ESPERADOS", "DESCRIPCIÓN"}, 0) {
    @Override public boolean isCellEditable(int row, int column) { return false; }
};
private final JTable syntaxTable = new JTable(syntaxModel);
	private final DefaultTableModel semanticModel = new DefaultTableModel(new Object[] {"ESTADO", "DESCRIPCIÓN"}, 0) {
		@Override public boolean isCellEditable(int row, int column) { return false; }
	};
	private final JTable semanticTable = new JTable(semanticModel);
	private List<Control.ResultadoToken> resultados = Collections.emptyList();
	private List<Control.ResultadoSintactico> resultadosSintacticos = Collections.emptyList();
	private final List<Object> errorLineHighlights = new java.util.ArrayList<>();
	private final List<Object> syntaxErrorHighlights = new java.util.ArrayList<>();
	private LineNumbers lineNumbers;
	private File currentFile;
	private boolean dirty;
	private boolean analisisLexicoExitoso;
	private JTabbedPane analysisTabs;

	public Ide() {
		this(new Control());
	}

	public Ide(Control control) {
		super("TypeTec");
		this.control = control;
		configureWindow();
		setJMenuBar(createMenuBar());
		add(createToolbar(), BorderLayout.NORTH);
		add(createWorkspace(), BorderLayout.CENTER);
		add(createStatusBar(), BorderLayout.SOUTH);
		editor.addCaretListener(this::updatePosition);
		editor.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
			@Override
			public void insertUpdate(javax.swing.event.DocumentEvent e) { markDirty(); }
			@Override
			public void removeUpdate(javax.swing.event.DocumentEvent e) { markDirty(); }
			@Override
			public void changedUpdate(javax.swing.event.DocumentEvent e) { }
		});
		updatePosition(null);
	}

	private void configureWindow() {
		setDefaultCloseOperation(DO_NOTHING_ON_CLOSE);
		addWindowListener(new java.awt.event.WindowAdapter() {
			@Override public void windowClosing(java.awt.event.WindowEvent e) { exit(); }
		});
		setMinimumSize(new Dimension(980, 640));
		setSize(1200, 800);
		setLocationRelativeTo(null);
		setExtendedState(JFrame.MAXIMIZED_BOTH);
		getContentPane().setBackground(PANEL);
	}

	private JMenuBar createMenuBar() {
		JMenuBar menuBar = new JMenuBar();
		JMenu file = new JMenu("Archivo");
		file.add(menuItem("Nuevo", e -> newFile()));
		file.add(menuItem("Abrir...", e -> openFile()));
		file.addSeparator();
		file.add(menuItem("Guardar", e -> saveFile(false)));
		file.add(menuItem("Guardar como", e -> saveFile(true)));
		file.addSeparator();
		file.add(menuItem("Salir", e -> exit()));
		menuBar.add(file);
		return menuBar;
	}

	private JMenuItem menuItem(String text, java.awt.event.ActionListener action) {
		JMenuItem item = new JMenuItem(text);
		item.addActionListener(action);
		return item;
	}

	private JToolBar createToolbar() {
		JToolBar bar = new JToolBar();
		bar.setFloatable(false);
		bar.setBackground(Color.WHITE);
		bar.setBorder(new EmptyBorder(8, 12, 8, 12));
		bar.add(toolButton("Nuevo", e -> newFile()));
		bar.add(toolButton("Abrir", e -> openFile()));
		bar.add(toolButton("Guardar", e -> saveFile(false)));
		bar.addSeparator(new Dimension(14, 1));
		JButton analyze = toolButton("Analizar", e -> analyze());
		analyze.setBackground(NAVY);
		analyze.setForeground(Color.WHITE);
		bar.add(analyze);
		bar.addSeparator(new Dimension(18, 1));
		bar.add(fileLabel);
		return bar;
	}

	private JButton toolButton(String text, java.awt.event.ActionListener action) {
		JButton button = new JButton(text);
		button.setFocusPainted(false);
		button.setBorder(BorderFactory.createCompoundBorder(
				BorderFactory.createLineBorder(BORDER), new EmptyBorder(7, 12, 7, 12)));
		button.addActionListener(action);
		return button;
	}

	private JPanel createWorkspace() {
		JPanel editorPanel = new JPanel(new BorderLayout(0, 8));
		editorPanel.setBorder(new EmptyBorder(12, 12, 8, 8));
		editorPanel.setBackground(PANEL);
		JLabel title = sectionTitle("EDITOR DE CÓDIGO");
		editorPanel.add(title, BorderLayout.NORTH);
		editor.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 14));
		editor.setMargin(new Insets(12, 14, 12, 14));
		editor.setBackground(Color.WHITE);
		editor.setCaretColor(NAVY);
		editor.setSelectionColor(new Color(217, 240, 236));
		editor.setSelectedTextColor(Color.BLACK);             
		editor.setHighlighter(new DefaultHighlighter());
		editor.addMouseListener(new java.awt.event.MouseAdapter() {
			@Override public void mouseClicked(java.awt.event.MouseEvent e) {
				if (e.getClickCount() == 2) {
					SwingUtilities.invokeLater(() -> seleccionarPalabra(editor.getCaretPosition()));
				}
			}
		});
		lineNumbers = new LineNumbers(editor);
		editorPanel.add(new LineNumberScrollPane(editor, lineNumbers), BorderLayout.CENTER);

		JPanel analysis = createAnalysisPanel();
		JSplitPane split = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, editorPanel, analysis);
		split.setResizeWeight(.75);
		split.setDividerSize(6);
		split.setBorder(null);

		JPanel consolePanel = new JPanel(new BorderLayout(0, 5));
		consolePanel.setBorder(new EmptyBorder(8, 12, 8, 12));
		consolePanel.setBackground(PANEL);
		JPanel consoleHeading = new JPanel(new BorderLayout());
		consoleHeading.setOpaque(false);
		consoleHeading.add(sectionTitle("CONSOLA"), BorderLayout.WEST);
		consoleHeading.add(toolButton("Limpiar Consola", e -> limpiarConsola()), BorderLayout.EAST);
		consolePanel.add(consoleHeading, BorderLayout.NORTH);
		console.setEditable(false);
		console.setRows(8);
		console.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
		console.setForeground(new Color(51, 65, 85));
		console.setBackground(Color.WHITE);
		console.setBorder(new EmptyBorder(8, 10, 8, 10));
		JScrollPane consoleScroll = new JScrollPane(console);
		consoleScroll.setPreferredSize(new Dimension(0, 190));
		consolePanel.add(consoleScroll, BorderLayout.CENTER);

		JSplitPane workspaceSplit = new JSplitPane(JSplitPane.VERTICAL_SPLIT, split, consolePanel);
		workspaceSplit.setResizeWeight(.72);
		workspaceSplit.setDividerSize(6);
		workspaceSplit.setBorder(null);
		JPanel center = new JPanel(new BorderLayout());
		center.setBackground(PANEL);
		center.add(workspaceSplit, BorderLayout.CENTER);
		return center;
	}

	private JPanel createAnalysisPanel() {
		JPanel panel = new JPanel(new BorderLayout(0, 8));
		panel.setBorder(new EmptyBorder(12, 8, 8, 12));
		panel.setBackground(PANEL);
		JTabbedPane tabs = new JTabbedPane();
		analysisTabs = tabs;
		tabs.addTab("Análisis Léxico", createLexicalTab());
		tabs.addTab("Análisis Sintáctico", createSyntaxTab());
		tabs.addTab("Análisis Semántico", createSemanticTab());
		tabs.setEnabledAt(TAB_SINTACTICO, false);
		tabs.setEnabledAt(TAB_SEMANTICO, false);
		panel.add(tabs, BorderLayout.CENTER);
		return panel;
	}

	private JPanel createLexicalTab() {
		JPanel panel = new JPanel(new BorderLayout(0, 10));
		panel.setBackground(Color.WHITE);
		panel.setBorder(new EmptyBorder(12, 12, 12, 12));
		JPanel heading = new JPanel(new BorderLayout());
		heading.setOpaque(false);
		heading.add(sectionTitle("ANÁLISIS LÉXICO"), BorderLayout.WEST);
		heading.add(toolButton("Exportar Tabla", e -> exportTable()), BorderLayout.EAST);
		panel.add(heading, BorderLayout.NORTH);
		tokenTable.setRowHeight(23);
		tokenTable.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 12));
		tokenTable.getTableHeader().setFont(new Font(Font.SANS_SERIF, Font.BOLD, 12));
		tokenTable.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
		tokenTable.setShowGrid(false);
		tokenTable.setIntercellSpacing(new Dimension(0, 1));
		tokenTable.getColumnModel().getColumn(0).setPreferredWidth(42);
		tokenTable.getColumnModel().getColumn(1).setPreferredWidth(130);
		tokenTable.getColumnModel().getColumn(2).setPreferredWidth(150);
		tokenTable.setDefaultRenderer(Object.class, new DefaultTableCellRenderer() {
			@Override public java.awt.Component getTableCellRendererComponent(JTable table, Object value,
					boolean selected, boolean focused, int row, int column) {
				java.awt.Component c = super.getTableCellRendererComponent(table, value, selected, focused, row, column);
				boolean esError = row < resultados.size() && resultados.get(row).esError();
				if (selected) {
					c.setBackground(new Color(219, 234, 254));
				} else if (esError) {
					c.setBackground(new Color(254, 226, 226)); // rojo suave
				} else {
					c.setBackground(row % 2 == 0 ? Color.WHITE : PANEL);
				}
				setBorder(new EmptyBorder(0, 6, 0, 6));
				return c;
			}
		});

		tokenTable.getSelectionModel().addListSelectionListener(e -> {
			if (!e.getValueIsAdjusting()) {
				int fila = tokenTable.getSelectedRow();
				if (fila >= 0 && fila < resultados.size()) {
					irALinea(resultados.get(fila).linea());
				}
			}
		});
		panel.add(new JScrollPane(tokenTable), BorderLayout.CENTER);
		return panel;
	}

	private JPanel createSyntaxTab() {
		JPanel panel = new JPanel(new BorderLayout(0, 10));
		panel.setBackground(Color.WHITE);
		panel.setBorder(new EmptyBorder(12, 12, 12, 12));
		JPanel heading = new JPanel(new BorderLayout());
		heading.setOpaque(false);
		heading.add(sectionTitle("ANÁLISIS SINTÁCTICO"), BorderLayout.WEST);
		heading.add(toolButton("Exportar Tabla", e -> exportSyntaxTable()), BorderLayout.EAST);
		panel.add(heading, BorderLayout.NORTH);
		syntaxTable.setRowHeight(23);
		syntaxTable.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 12));
		syntaxTable.getTableHeader().setFont(new Font(Font.SANS_SERIF, Font.BOLD, 12));
		syntaxTable.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
		syntaxTable.setShowGrid(false);
		syntaxTable.setFillsViewportHeight(true);
		syntaxTable.setAutoResizeMode(JTable.AUTO_RESIZE_LAST_COLUMN);
		syntaxTable.getColumnModel().getColumn(0).setPreferredWidth(50);
		syntaxTable.getColumnModel().getColumn(1).setPreferredWidth(60);
		syntaxTable.setDefaultRenderer(Object.class, new DefaultTableCellRenderer() {
			@Override public java.awt.Component getTableCellRendererComponent(JTable table, Object value,
					boolean selected, boolean focused, int row, int column) {
				java.awt.Component c = super.getTableCellRendererComponent(table, value, selected, focused, row, column);
				c.setBackground(selected ? new Color(219, 234, 254) : new Color(254, 240, 138)); // amarillo
				setBorder(new EmptyBorder(0, 6, 0, 6));
				return c;
			}
		});

		syntaxTable.getSelectionModel().addListSelectionListener(e -> {
			if (!e.getValueIsAdjusting()) {
				int fila = syntaxTable.getSelectedRow();
				if (fila >= 0 && fila < resultadosSintacticos.size()) {
					irALinea(resultadosSintacticos.get(fila).linea());
				}
			}
		});
		panel.add(new JScrollPane(syntaxTable), BorderLayout.CENTER);
		return panel;
	}

	private JPanel createSemanticTab() {
		JPanel panel = new JPanel(new BorderLayout(0, 10));
		panel.setBackground(Color.WHITE);
		panel.setBorder(new EmptyBorder(12, 12, 12, 12));
		JPanel heading = new JPanel(new BorderLayout());
		heading.setOpaque(false);
		heading.add(sectionTitle("ANÁLISIS SEMÁNTICO"), BorderLayout.WEST);
		heading.add(toolButton("Exportar Tabla", e -> exportSemanticTable()), BorderLayout.EAST);
		panel.add(heading, BorderLayout.NORTH);
		semanticTable.setRowHeight(23);
		semanticTable.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 12));
		semanticTable.getTableHeader().setFont(new Font(Font.SANS_SERIF, Font.BOLD, 12));
		semanticTable.setShowGrid(false);
		semanticTable.setFillsViewportHeight(true);
		semanticTable.setAutoResizeMode(JTable.AUTO_RESIZE_LAST_COLUMN);
		panel.add(new JScrollPane(semanticTable), BorderLayout.CENTER);
		return panel;
	}
	
	private void clearSyntaxHighlights() {
		for (Object highlight : syntaxErrorHighlights) editor.getHighlighter().removeHighlight(highlight);
		syntaxErrorHighlights.clear();
	}

	private void highlightSyntaxErrorLines(List<Control.ResultadoSintactico> errores) {
		Element root = editor.getDocument().getDefaultRootElement();
		for (Control.ResultadoSintactico error : errores) {
			int lineIndex = error.linea() - 1;
			if (lineIndex < 0 || lineIndex >= root.getElementCount()) continue;
			try {
				Element line = root.getElement(lineIndex);
				int end = Math.min(line.getEndOffset(), editor.getDocument().getLength());
				syntaxErrorHighlights.add(editor.getHighlighter().addHighlight(line.getStartOffset(), end,
						new DefaultHighlighter.DefaultHighlightPainter(new Color(254, 240, 138)))); // amarillo suave
			} catch (BadLocationException ignoredException) { }
		}
	}
	
	private void setAnalysisTabEnabled(int index, boolean enabled) {
		if (analysisTabs == null || index < 0 || index >= analysisTabs.getTabCount()) return;
		analysisTabs.setEnabledAt(index, enabled);
		analysisTabs.revalidate();
		analysisTabs.repaint();
	}

	private JPanel createStatusBar() {
		JPanel bottom = new JPanel(new BorderLayout());
		bottom.setBorder(new EmptyBorder(7, 14, 7, 14));
		bottom.setBackground(NAVY);
		position.setForeground(Color.WHITE);
		bottom.add(position, BorderLayout.WEST);
		JLabel mode = new JLabel("TypeTec  •  Lexer JavaCC");
		mode.setForeground(new Color(203, 213, 225));
		bottom.add(mode, BorderLayout.EAST);
		return bottom;
	}

	private JLabel sectionTitle(String text) {
		JLabel label = new JLabel(text);
		label.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 11));
		label.setForeground(MUTED);
		return label;
	}

	private void analyze() {
		console.setText("");
		tokenModel.setRowCount(0);
		syntaxModel.setRowCount(0);
		semanticModel.setRowCount(0);
		resultadosSintacticos = Collections.emptyList();
		analisisLexicoExitoso = false;
		setAnalysisTabEnabled(TAB_SINTACTICO, false);
		setAnalysisTabEnabled(TAB_SEMANTICO, false);
		clearErrorHighlights();
		clearSyntaxHighlights();
		try {
			resultados = control.analizarLexico(editor.getText());
			for (Control.ResultadoToken token : resultados) {
				tokenModel.addRow(new Object[] {token.id(), token.lexema(), token.nombre()});
			}
			highlightErrorLines();
			aplicarResaltadoLexico();
			appendConsole("ANÁLISIS LÉXICO");
			appendConsole(resultados.size() + " tokens reconocidos.");
			long erroresLexicos = resultados.stream().filter(Control.ResultadoToken::esError).count();
			appendConsole(erroresLexicos + " errores léxicos.");
			if (erroresLexicos > 0) {
				for (Control.ResultadoToken token : resultados) {
					if (token.esError()) {
						appendConsole("Error léxico en línea " + token.linea() + ", columna "
								+ token.columna() + ": " + token.descripcion());
					}
				}
				return;
			}
			appendConsole("Análisis léxico completado correctamente.");
			analisisLexicoExitoso = true;
			setAnalysisTabEnabled(TAB_SINTACTICO, true);

			resultadosSintacticos = control.analizarSintactico(editor.getText(), resultados);
			for (Control.ResultadoSintactico e : resultadosSintacticos) {
				syntaxModel.addRow(new Object[] {e.linea(), e.columna(), e.encontrado(),
						e.esperados(), e.descripcion()});
				appendConsole("[ERROR SINTÁCTICO]");
				appendConsole("Línea: " + e.linea() + "    Columna: " + e.columna());
				appendConsole("Se encontró: " + e.encontrado());
				appendConsole("Se esperaba: " + e.esperados());
				appendConsole("Descripción: " + e.descripcion());
			}
			appendConsole("ANÁLISIS SINTÁCTICO");
			if (resultadosSintacticos.isEmpty()) {
				syntaxModel.addRow(new Object[] {"-", "-", "-", "-", "Sin errores sintácticos. La estructura del programa es válida."});
				appendConsole("0 errores sintácticos.");
				appendConsole("La estructura del programa es válida.");
				appendConsole("Análisis sintáctico completado correctamente.");
				semanticModel.addRow(new Object[] {"VÁLIDO", "No se encontraron errores semánticos."});
				setAnalysisTabEnabled(TAB_SEMANTICO, true);
			} else {
				highlightSyntaxErrorLines(resultadosSintacticos);
				appendConsole(resultadosSintacticos.size() + " error(es) sintáctico(s) encontrado(s).");
				appendConsole("El análisis semántico permanece bloqueado.");
			}
			analysisTabs.revalidate();
			analysisTabs.repaint();
		} catch (IOException | RuntimeException ex) {
			appendConsole("Error durante el análisis: " + ex.getMessage());
		}
	}

	private void aplicarResaltadoLexico() {
		StyledDocument document = editor.getStyledDocument();
		Style normal = editor.addStyle("normal", null);
		StyleConstants.setForeground(normal, new Color(31, 41, 55));
		document.setCharacterAttributes(0, document.getLength(), normal, true);
		for (Control.ResultadoToken token : resultados) {
			int inicio = posicionOffset(token.linea(), token.columna());
			if (inicio < 0 || inicio >= document.getLength()) continue;
			Style style = editor.addStyle("token-" + token.nombre(), null);
			StyleConstants.setForeground(style, colorToken(token.nombre()));
			int longitud = Math.min(token.lexema().length(), document.getLength() - inicio);
			document.setCharacterAttributes(inicio, longitud, style, true);
		}
	}

	private int posicionOffset(int linea, int columna) {
		Element root = editor.getDocument().getDefaultRootElement();
		if (linea < 1 || linea > root.getElementCount()) return -1;
		return Math.min(root.getElement(linea - 1).getStartOffset() + Math.max(0, columna - 1),
				editor.getDocument().getLength());
	}

	private Color colorToken(String nombre) {
		if (nombre == null) return new Color(31, 41, 55);
		if (nombre.startsWith("TIPO_") || "VOID".equals(nombre)) return new Color(22, 101, 52);
		if ("CADENA".equals(nombre)) return new Color(154, 52, 18);
		if (nombre.equals("ENTERO") || nombre.equals("DECIMAL") || nombre.equals("HEXADECIMAL")
				|| nombre.equals("BINARIO") || nombre.equals("OCTAL") || nombre.equals("EXPONENCIAL")) {
			return new Color(107, 33, 168);
		}
		if (nombre.startsWith("OPERADOR_")) return Color.BLACK;
		if ("ERROR_LEXICO".equals(nombre)) return new Color(185, 28, 28);
		String[] reservadas = {"LET", "CONST", "VAR", "IF", "ELSE", "FOR", "WHILE", "RETURN",
				"CLASS", "FUNCTION", "SWITCH"};
		for (String reservada : reservadas) if (reservada.equals(nombre)) return new Color(30, 64, 175);
		return new Color(31, 41, 55);
	}

	private void irALinea(int linea) {
		Element root = editor.getDocument().getDefaultRootElement();
		int lineIndex = linea - 1;
		if (lineIndex < 0 || lineIndex >= root.getElementCount()) return;
		Element lineElement = root.getElement(lineIndex);
		editor.setCaretPosition(lineElement.getStartOffset());
		editor.requestFocusInWindow();
		try {
			java.awt.geom.Rectangle2D rectangle = editor.modelToView2D(lineElement.getStartOffset());
			if (rectangle != null) editor.scrollRectToVisible(rectangle.getBounds());
		} catch (BadLocationException ignored) { }
	}

	private void openFile() {
		JFileChooser chooser = new JFileChooser();
		chooser.setFileFilter(new javax.swing.filechooser.FileNameExtensionFilter("Archivos de texto (*.txt)", "txt"));
		if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
			try {
				currentFile = chooser.getSelectedFile();
				if (!esArchivoTxt(currentFile)) {
					showError("Solo se pueden abrir archivos .txt.");
					return;
				}
				editor.setText(control.abrirArchivo(currentFile.toPath()));
				dirty = false;
				fileLabel.setText(currentFile.getName());
				appendConsole("Archivo cargado correctamente.");
			} catch (IOException ex) { showError("No se pudo abrir el archivo: " + ex.getMessage()); }
		}
	}

	private void saveFile(boolean chooseLocation) {
		if (currentFile == null || chooseLocation) {
			JFileChooser chooser = new JFileChooser();
			chooser.setFileFilter(new javax.swing.filechooser.FileNameExtensionFilter("Archivos de texto (*.txt)", "txt"));
			if (chooser.showSaveDialog(this) != JFileChooser.APPROVE_OPTION) return;
			currentFile = chooser.getSelectedFile();
			if (!esArchivoTxt(currentFile)) {
				currentFile = new File(currentFile.getPath() + ".txt");
			}
		}
		try {
				control.guardarArchivo(currentFile.toPath(), editor.getText());
			dirty = false;
			fileLabel.setText(currentFile.getName());
			appendConsole("Archivo guardado correctamente.");
		} catch (IOException ex) { showError("No se pudo guardar el archivo: " + ex.getMessage()); }
	}

	private void newFile() {
		if (dirty && JOptionPane.showConfirmDialog(this, "Hay cambios sin guardar. ¿Continuar?", "Nuevo archivo",
				JOptionPane.YES_NO_OPTION) != JOptionPane.YES_OPTION) return;
		editor.setText("");
		currentFile = null;
		dirty = false;
		fileLabel.setText("Sin archivo");
		limpiarResultados();
		limpiarConsola();
	}

	private void limpiarResultados() {
		tokenModel.setRowCount(0);
		syntaxModel.setRowCount(0);
		resultados = Collections.emptyList();
		resultadosSintacticos = Collections.emptyList();
		analisisLexicoExitoso = false;
		semanticModel.setRowCount(0);
		clearErrorHighlights();
		clearSyntaxHighlights();
		if (analysisTabs != null) {
			setAnalysisTabEnabled(TAB_SINTACTICO, false);
			setAnalysisTabEnabled(TAB_SEMANTICO, false);
			analysisTabs.setSelectedIndex(TAB_LEXICO);
		}
	}

	private void limpiarConsola() {
		console.setText("");
	}

	private void exportTable() {
		JFileChooser chooser = new JFileChooser();
		chooser.setSelectedFile(new File("tokens.txt"));
		if (chooser.showSaveDialog(this) != JFileChooser.APPROVE_OPTION) return;
		try {
			control.exportarTabla(chooser.getSelectedFile().toPath(), resultados);
			appendConsole("Tabla exportada correctamente.");
		} catch (IOException ex) { showError("No se pudo exportar la tabla: " + ex.getMessage()); }
	}

	private void exportSyntaxTable() {
		if (!analisisLexicoExitoso) {
			return;
		}
		JFileChooser chooser = new JFileChooser();
		chooser.setSelectedFile(new File("sintaxis.txt"));
		if (chooser.showSaveDialog(this) != JFileChooser.APPROVE_OPTION) return;
		File archivo = chooser.getSelectedFile();
		if (!archivo.getName().toLowerCase(java.util.Locale.ROOT).endsWith(".txt")) {
			archivo = new File(archivo.getPath() + ".txt");
		}
		try {
			control.exportarTablaSintactica(archivo.toPath(), resultadosSintacticos);
			appendConsole("Tabla sintáctica exportada correctamente.");
		} catch (IOException ex) {
			showError("No se pudo exportar la tabla sintáctica: " + ex.getMessage());
		}
	}

	private void exportSemanticTable() {
		if (!analisisLexicoExitoso || !analysisTabs.isEnabledAt(TAB_SEMANTICO)) return;
		JFileChooser chooser = new JFileChooser();
		chooser.setSelectedFile(new File("semantica.txt"));
		if (chooser.showSaveDialog(this) != JFileChooser.APPROVE_OPTION) return;
		File archivo = chooser.getSelectedFile();
		if (!archivo.getName().toLowerCase(java.util.Locale.ROOT).endsWith(".txt")) {
			archivo = new File(archivo.getPath() + ".txt");
		}
		try {
			StringBuilder salida = new StringBuilder("ESTADO\tDESCRIPCIÓN\n");
			for (int fila = 0; fila < semanticModel.getRowCount(); fila++) {
				salida.append(semanticModel.getValueAt(fila, 0)).append('\t')
						.append(semanticModel.getValueAt(fila, 1)).append('\n');
			}
			control.guardarArchivo(archivo.toPath(), salida.toString());
			appendConsole("Tabla semántica exportada correctamente.");
		} catch (IOException ex) {
			showError("No se pudo exportar la tabla semántica: " + ex.getMessage());
		}
	}

	private void exit() {
		if (!dirty || JOptionPane.showConfirmDialog(this, "Hay cambios sin guardar. ¿Salir?", "Salir",
				JOptionPane.YES_NO_OPTION) == JOptionPane.YES_OPTION) System.exit(0);
	}

	private void markDirty() {
		dirty = true;
		if (analysisTabs != null) {
			setAnalysisTabEnabled(TAB_SINTACTICO, false);
			setAnalysisTabEnabled(TAB_SEMANTICO, false);
		}
	}

	private boolean esArchivoTxt(File archivo) {
		return archivo != null && archivo.getName().toLowerCase(java.util.Locale.ROOT).endsWith(".txt");
	}

	private void updatePosition(CaretEvent event) {
		int caret = event == null ? editor.getCaretPosition() : event.getDot();
		Element root = editor.getDocument().getDefaultRootElement();
		int line = root.getElementIndex(caret);
		int column = caret - root.getElement(line).getStartOffset();
		position.setText("Línea: " + (line + 1) + "    Columna: " + (column + 1));
	}

	private void clearErrorHighlights() {
		for (Object highlight : errorLineHighlights) editor.getHighlighter().removeHighlight(highlight);
		errorLineHighlights.clear();
		if (lineNumbers != null) lineNumbers.setErrorLines(Collections.emptySet());
	}

	private void highlightErrorLines() {
		Set<Integer> errorLines = new HashSet<>();
		Element root = editor.getDocument().getDefaultRootElement();
		for (Control.ResultadoToken token : resultados) {
			if (!token.esError()) continue;
			int lineIndex = token.linea() - 1;
			if (lineIndex < 0 || lineIndex >= root.getElementCount()) continue;
			errorLines.add(token.linea());
			try {
				Element line = root.getElement(lineIndex);
				int end = Math.min(line.getEndOffset(), editor.getDocument().getLength());
				errorLineHighlights.add(editor.getHighlighter().addHighlight(line.getStartOffset(), end,
						new DefaultHighlighter.DefaultHighlightPainter(new Color(254, 226, 226))));
			} catch (BadLocationException ignoredException) { }
		}
		lineNumbers.setErrorLines(errorLines);
	}

	private void appendConsole(String message) {
		console.append(message + System.lineSeparator());
	}

	private void showError(String message) {
		appendConsole(message);
		JOptionPane.showMessageDialog(this, message, "TypeTec", JOptionPane.ERROR_MESSAGE);
	}

	private boolean esCaracterIdentificador(char c) {
		return Character.isLetterOrDigit(c) || c == '_' || c == '$';
	}

	private void seleccionarPalabra(int posicion) {
		try {
			javax.swing.text.Document doc = editor.getDocument();
			String texto = doc.getText(0, doc.getLength());
			if (posicion < 0 || posicion > texto.length()) return;

			boolean derechaEsPalabra = posicion < texto.length() && esCaracterIdentificador(texto.charAt(posicion));
			boolean izquierdaEsPalabra = posicion > 0 && esCaracterIdentificador(texto.charAt(posicion - 1));
			if (!derechaEsPalabra && !izquierdaEsPalabra) return; // clic en espacio o símbolo: no seleccionar nada

			int centro = derechaEsPalabra ? posicion : posicion - 1;
			int inicio = centro;
			while (inicio > 0 && esCaracterIdentificador(texto.charAt(inicio - 1))) inicio--;
			int fin = centro + 1;
			while (fin < texto.length() && esCaracterIdentificador(texto.charAt(fin))) fin++;

			editor.select(inicio, fin);
		} catch (BadLocationException ignored) { }
	}

	public static void mostrar(Control control) {
		try {
			UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
		} catch (ReflectiveOperationException | UnsupportedLookAndFeelException ignored) { }
		SwingUtilities.invokeLater(() -> new Ide(control).setVisible(true));
	}

	private final class LineNumberScrollPane extends JScrollPane {
		LineNumberScrollPane(JTextComponent component, LineNumbers numbers) {
			super(component);
			setRowHeaderView(numbers);
			setBorder(BorderFactory.createLineBorder(BORDER));
		}
	}

	private static final class LineNumbers extends JTextArea {
		private final JTextComponent editor;
		private Set<Integer> errorLines = Collections.emptySet();
		private int displayedLineCount = -1;
		LineNumbers(JTextComponent editor) {
			this.editor = editor;
			setEditable(false);
			setFocusable(false);
			setLineWrap(false);
			setWrapStyleWord(false);
			setFont(editor.getFont());
			setForeground(MUTED);
			setBackground(new Color(241, 245, 249));
			setBorder(new EmptyBorder(12, 8, 12, 8));
			editor.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
				@Override
				public void insertUpdate(javax.swing.event.DocumentEvent e) { update(); }
				@Override
				public void removeUpdate(javax.swing.event.DocumentEvent e) { update(); }
				@Override
				public void changedUpdate(javax.swing.event.DocumentEvent e) { update(); }
			});
			update();
		}
		private void update() {
			int lines = editor.getDocument().getDefaultRootElement().getElementCount();
			if (lines == displayedLineCount) return;
			displayedLineCount = lines;
			StringBuilder numbers = new StringBuilder();
			for (int i = 1; i <= lines; i++) numbers.append(i).append('\n');
			setText(numbers.toString());
		}
		void setErrorLines(Set<Integer> errorLines) {
			this.errorLines = new HashSet<>(errorLines);
			repaint();
		}
		@Override protected void paintComponent(java.awt.Graphics graphics) {
			super.paintComponent(graphics);
			graphics.setColor(new Color(220, 38, 38));
			int lineHeight = getFontMetrics(getFont()).getHeight();
			for (Integer line : errorLines) {
				int y = (line - 1) * lineHeight + (lineHeight - 7) / 2;
				graphics.fillOval(3, y, 7, 7);
			}
		}
	}
}
