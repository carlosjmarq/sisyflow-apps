import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:sisyflow_mobile/data/blocknote_adapter.dart';

void main() {
  test('convierte párrafos, encabezados y listas a AppFlowy', () {
    final blockNote = jsonEncode([
      {
        'type': 'heading',
        'props': {'level': 2},
        'content': [
          {
            'type': 'text',
            'text': 'Título',
            'styles': {'bold': true},
          },
        ],
      },
      {
        'type': 'bulletListItem',
        'content': [
          {'type': 'text', 'text': 'Item', 'styles': <String, dynamic>{}},
        ],
      },
      {
        'type': 'checkListItem',
        'props': {'checked': true},
        'content': [
          {'type': 'text', 'text': 'Hecho', 'styles': <String, dynamic>{}},
        ],
      },
    ]);

    final document = jsonDecode(blockNoteToAppFlowyDocument(blockNote));
    final children = document['document']['children'] as List;
    expect(children, hasLength(3));
    expect(children[0]['type'], 'heading');
    expect(children[0]['data']['level'], 2);
    expect(children[0]['data']['delta'][0]['attributes']['bold'], true);
    expect(children[1]['type'], 'bulleted_list');
    expect(children[2]['type'], 'todo_list');
    expect(children[2]['data']['checked'], true);
  });

  test('ida y vuelta conserva tipos y texto', () {
    final blockNote = jsonEncode([
      {
        'type': 'paragraph',
        'content': [
          {'type': 'text', 'text': 'Hola ', 'styles': <String, dynamic>{}},
          {
            'type': 'link',
            'href': 'https://sisyflow.app',
            'content': [
              {
                'type': 'text',
                'text': 'web',
                'styles': {'italic': true},
              },
            ],
          },
        ],
      },
      {'type': 'divider', 'content': <Map<String, dynamic>>[]},
      {
        'type': 'codeBlock',
        'props': {'language': 'dart'},
        'content': [
          {
            'type': 'text',
            'text': 'void main() {}',
            'styles': <String, dynamic>{},
          },
        ],
      },
    ]);

    final appFlowy = blockNoteToAppFlowyDocument(blockNote);
    final back = appFlowyToBlockNote(appFlowy);
    final blocks = parseBlockNote(back);
    expect(blocks, hasLength(3));
    expect(blocks[0]['type'], 'paragraph');
    expect(blocks[0]['content'][0]['text'], 'Hola ');
    expect(blocks[0]['content'][1]['type'], 'link');
    expect(blocks[0]['content'][1]['href'], 'https://sisyflow.app');
    expect(blocks[1]['type'], 'divider');
    expect(blocks[2]['type'], 'codeBlock');
    expect(blocks[2]['content'][0]['text'], 'void main() {}');
  });

  test('tipos desconocidos degradan a párrafo sin perder texto', () {
    final blockNote = jsonEncode([
      {
        'type': 'image',
        'content': [
          {'type': 'text', 'text': 'foto.png', 'styles': <String, dynamic>{}},
        ],
      },
    ]);
    final document = jsonDecode(blockNoteToAppFlowyDocument(blockNote));
    final children = document['document']['children'] as List;
    expect(children.first['type'], 'paragraph');
    expect(children.first['data']['delta'][0]['insert'], 'foto.png');
  });

  test('texto plano y markdown legacy se leen como párrafos', () {
    final blocks = parseBlockNote('markdown viejo sin JSON');
    expect(blocks, hasLength(1));
    expect(blocks.first['type'], 'paragraph');
    expect(blockNoteToPlainText('markdown viejo'), 'markdown viejo');
  });

  test('plainTextToBlockNote genera párrafos válidos', () {
    final blocks = parseBlockNote(plainTextToBlockNote('uno\ndos'));
    expect(blocks, hasLength(2));
    expect(blocks[0]['content'][0]['text'], 'uno');
    expect(blocks[1]['content'][0]['text'], 'dos');
  });
}
