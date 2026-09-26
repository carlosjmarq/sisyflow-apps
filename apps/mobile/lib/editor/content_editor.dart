import 'dart:async';
import 'dart:convert';

import 'package:appflowy_editor/appflowy_editor.dart';
import 'package:flutter/material.dart';

import '../data/blocknote_adapter.dart';

const _debounceMs = 800;

class ContentEditor extends StatefulWidget {
  const ContentEditor({
    super.key,
    required this.content,
    required this.contentFormat,
    required this.onChanged,
    this.readOnly = false,
  });

  final String content;
  final String contentFormat;
  final void Function(String content, String contentFormat) onChanged;
  final bool readOnly;

  @override
  State<ContentEditor> createState() => _ContentEditorState();
}

class _ContentEditorState extends State<ContentEditor> {
  EditorState? _editorState;
  StreamSubscription<EditorTransactionValue>? _subscription;
  Timer? _debounce;
  late final TextEditingController _markdownController;

  bool get _isMarkdown => widget.contentFormat == 'markdown';

  @override
  void initState() {
    super.initState();
    _markdownController = TextEditingController(
      text: _isMarkdown ? widget.content : '',
    );
    if (!_isMarkdown) {
      final json = jsonDecode(blockNoteToAppFlowyDocument(widget.content));
      _editorState = EditorState(
        document: Document.fromJson(json as Map<String, dynamic>),
      );
      _subscription = _editorState!.transactionStream.listen((_) {
        _debounce?.cancel();
        _debounce = Timer(const Duration(milliseconds: _debounceMs), _emit);
      });
    }
  }

  void _emit() {
    final state = _editorState;
    if (state == null) return;
    widget.onChanged(appFlowyToBlockNote(state.document.toJson()), 'blocknote');
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _subscription?.cancel();
    _editorState?.dispose();
    _markdownController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (_isMarkdown) {
      return TextField(
        controller: _markdownController,
        maxLines: null,
        minLines: 8,
        enabled: !widget.readOnly,
        decoration: const InputDecoration(
          hintText: 'Contenido (markdown)',
          border: OutlineInputBorder(),
        ),
        onChanged: (value) => widget.onChanged(value, 'markdown'),
      );
    }
    return AppFlowyEditor(
      editorState: _editorState!,
      editable: !widget.readOnly,
      editorStyle: EditorStyle.mobile(
        padding: const EdgeInsets.all(12),
        cursorColor: theme.colorScheme.primary,
        selectionColor: theme.colorScheme.primary.withValues(alpha: 0.25),
        textStyleConfiguration: TextStyleConfiguration(
          text: TextStyle(fontSize: 16, color: theme.colorScheme.onSurface),
        ),
      ),
    );
  }
}
