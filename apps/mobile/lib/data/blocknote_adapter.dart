/// Adaptador BlockNote JSON ↔ AppFlowy Editor JSON (ADR-015).
///
/// BlockNote (desktop) guarda una lista de bloques:
/// `[{id, type, props, content: [{type: text|link, ...}], children: []}]`.
/// AppFlowy espera un documento `{document: {type: page, children: [...]}}`
/// con `data.delta` (formato Quill) y `children` anidados.
///
/// El subconjunto soportado es: párrafo, encabezados 1–3, listas (viñetas,
/// numerada, check), cita, bloque de código y separador. Los tipos no
/// soportados degradan a párrafo con su texto (sin perder información).
library;

import 'dart:convert';

const _blockNoteTypeToAppFlowy = <String, String>{
  'paragraph': 'paragraph',
  'heading': 'heading',
  'bulletListItem': 'bulleted_list',
  'numberedListItem': 'numbered_list',
  'checkListItem': 'todo_list',
  'quote': 'quote',
  'codeBlock': 'code_block',
  'divider': 'divider',
};

const _appFlowyTypeToBlockNote = <String, String>{
  'paragraph': 'paragraph',
  'heading': 'heading',
  'bulleted_list': 'bulletListItem',
  'numbered_list': 'numberedListItem',
  'todo_list': 'checkListItem',
  'quote': 'quote',
  'code_block': 'codeBlock',
  'divider': 'divider',
};

List<Map<String, dynamic>> parseBlockNote(String content) {
  try {
    final parsed = jsonDecode(content);
    if (parsed is List) {
      return parsed.whereType<Map>().map(Map<String, dynamic>.from).toList();
    }
    if (parsed is Map) return [Map<String, dynamic>.from(parsed)];
  } catch (_) {
    // markdown legacy u otro formato
  }
  if (content.trim().isEmpty) return const [];
  return [
    {
      'type': 'paragraph',
      'content': [
        {'type': 'text', 'text': content, 'styles': <String, dynamic>{}},
      ],
    },
  ];
}

String encodeBlockNote(List<Map<String, dynamic>> blocks) => jsonEncode(blocks);

/// Texto plano de los bloques (para previews y fallback del editor).
String blockNoteToPlainText(String content) {
  final buffer = StringBuffer();
  for (final block in parseBlockNote(content)) {
    buffer.writeln(_inlineText(block['content']));
    final children = block['children'];
    if (children is List) {
      for (final child in children.whereType<Map>()) {
        buffer.writeln(_inlineText(child['content']));
      }
    }
  }
  return buffer.toString().trim();
}

String _inlineText(Object? content) {
  if (content is String) return content;
  if (content is! List) return '';
  final buffer = StringBuffer();
  for (final item in content.whereType<Map>()) {
    if (item['type'] == 'link' && item['content'] is List) {
      buffer.write(_inlineText(item['content']));
    } else if (item['text'] != null) {
      buffer.write(item['text']);
    }
  }
  return buffer.toString();
}

List<Map<String, dynamic>> _inlineToDelta(Object? content) {
  if (content is String) {
    return [
      {'insert': content},
    ];
  }
  if (content is! List) return const [];
  final delta = <Map<String, dynamic>>[];
  for (final item in content.whereType<Map>()) {
    if (item['type'] == 'link' && item['content'] is List) {
      for (final nested in _inlineToDelta(item['content'])) {
        final attributes = Map<String, dynamic>.from(
          nested['attributes'] as Map? ?? {},
        );
        attributes['href'] = item['href'];
        delta.add({'insert': nested['insert'], 'attributes': attributes});
      }
      continue;
    }
    final text = item['text'];
    if (text == null) continue;
    final styles = item['styles'];
    final attributes = <String, dynamic>{};
    if (styles is Map) {
      for (final style in [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'code',
      ]) {
        if (styles[style] == true) {
          attributes[style] = true;
        }
      }
    }
    delta.add({
      'insert': text,
      if (attributes.isNotEmpty) 'attributes': attributes,
    });
  }
  return delta;
}

List<Map<String, dynamic>> _deltaToInline(Object? delta) {
  if (delta is! List) return const [];
  final content = <Map<String, dynamic>>[];
  for (final op in delta.whereType<Map>()) {
    final insert = op['insert'];
    if (insert is! String) continue;
    final attributes = op['attributes'];
    final styles = <String, dynamic>{};
    String? href;
    if (attributes is Map) {
      for (final style in [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'code',
      ]) {
        if (attributes[style] == true) styles[style] = true;
      }
      href = attributes['href']?.toString() ?? attributes['link']?.toString();
    }
    final text = {'type': 'text', 'text': insert, 'styles': styles};
    if (href != null && href.isNotEmpty) {
      content.add({
        'type': 'link',
        'href': href,
        'content': [text],
      });
    } else {
      content.add(text);
    }
  }
  return content;
}

Map<String, dynamic> _blockNoteBlockToNode(Map<String, dynamic> block) {
  final type = block['type']?.toString() ?? 'paragraph';
  final props = block['props'] is Map
      ? Map<String, dynamic>.from(block['props'] as Map)
      : <String, dynamic>{};
  final delta = _inlineToDelta(block['content']);
  final children = <Map<String, dynamic>>[];
  final blockChildren = block['children'];
  if (blockChildren is List) {
    for (final child in blockChildren.whereType<Map>()) {
      children.add(_blockNoteBlockToNode(Map<String, dynamic>.from(child)));
    }
  }

  if (type == 'divider') {
    return {
      'type': 'divider',
      'data': <String, dynamic>{},
      if (children.isNotEmpty) 'children': children,
    };
  }

  final appFlowyType = _blockNoteTypeToAppFlowy[type] ?? 'paragraph';
  final data = <String, dynamic>{'delta': delta};
  switch (appFlowyType) {
    case 'heading':
      final level = int.tryParse(props['level']?.toString() ?? '1') ?? 1;
      data['level'] = level.clamp(1, 3);
    case 'todo_list':
      data['checked'] = props['checked'] == true;
    case 'code_block':
      data['language'] = props['language']?.toString() ?? 'plain text';
    case 'paragraph':
      final alignment = props['textAlignment']?.toString();
      if (alignment != null && alignment != 'left') {
        data['text_align'] = alignment;
      }
  }
  return {
    'type': appFlowyType,
    'data': data,
    if (children.isNotEmpty) 'children': children,
  };
}

Map<String, dynamic> _nodeToBlockNoteBlock(Map<String, dynamic> node) {
  final type = node['type']?.toString() ?? 'paragraph';
  final data = node['data'] is Map
      ? Map<String, dynamic>.from(node['data'] as Map)
      : <String, dynamic>{};
  final blockType = _appFlowyTypeToBlockNote[type] ?? 'paragraph';
  final children = <Map<String, dynamic>>[];
  final nodeChildren = node['children'];
  if (nodeChildren is List) {
    for (final child in nodeChildren.whereType<Map>()) {
      children.add(_nodeToBlockNoteBlock(Map<String, dynamic>.from(child)));
    }
  }

  final props = <String, dynamic>{
    'textColor': 'default',
    'backgroundColor': 'default',
    'textAlignment': data['text_align']?.toString() ?? 'left',
  };
  if (blockType == 'heading') {
    props['level'] = int.tryParse(data['level']?.toString() ?? '1') ?? 1;
  }
  if (blockType == 'checkListItem') {
    props['checked'] = data['checked'] == true;
  }

  return {
    'type': blockType,
    'props': props,
    'content': _deltaToInline(data['delta']),
    'children': children,
  };
}

/// BlockNote JSON → documento JSON de AppFlowy.
String blockNoteToAppFlowyDocument(String content) {
  final children = parseBlockNote(content).map(_blockNoteBlockToNode).toList();
  if (children.isEmpty) {
    children.add({
      'type': 'paragraph',
      'data': {'delta': <Map<String, dynamic>>[]},
    });
  }
  return jsonEncode({
    'document': {'type': 'page', 'children': children},
  });
}

/// Documento de AppFlowy (o su JSON) → BlockNote JSON.
String appFlowyToBlockNote(Object? document) {
  Map<String, dynamic>? map;
  if (document is String) {
    try {
      final decoded = jsonDecode(document);
      if (decoded is Map) map = Map<String, dynamic>.from(decoded);
    } catch (_) {
      return '[]';
    }
  } else if (document is Map) {
    map = Map<String, dynamic>.from(document);
  }
  if (map == null) return '[]';

  final doc = map['document'];
  final children = doc is Map && doc['children'] is List
      ? (doc['children'] as List).whereType<Map>()
      : const Iterable<Map>.empty();
  final blocks = children
      .map((child) => _nodeToBlockNoteBlock(Map<String, dynamic>.from(child)))
      .toList();
  return encodeBlockNote(blocks);
}

/// Texto plano → bloques BlockNote (párrafos).
String plainTextToBlockNote(String text) {
  final blocks = text
      .split('\n')
      .map(
        (line) => <String, dynamic>{
          'type': 'paragraph',
          'props': {
            'textColor': 'default',
            'backgroundColor': 'default',
            'textAlignment': 'left',
          },
          'content': line.isEmpty
              ? <Map<String, dynamic>>[]
              : [
                  {'type': 'text', 'text': line, 'styles': <String, dynamic>{}},
                ],
          'children': <Map<String, dynamic>>[],
        },
      )
      .toList();
  return encodeBlockNote(
    blocks.isEmpty
        ? [
            {
              'type': 'paragraph',
              'props': {
                'textColor': 'default',
                'backgroundColor': 'default',
                'textAlignment': 'left',
              },
              'content': <Map<String, dynamic>>[],
              'children': <Map<String, dynamic>>[],
            },
          ]
        : blocks,
  );
}
