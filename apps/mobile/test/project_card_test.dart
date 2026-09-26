import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sisyflow_mobile/data/models.dart';
import 'package:sisyflow_mobile/features/home/widgets/project_card.dart';

Project _project() => Project(
  id: 'p1',
  epicId: 'e1',
  name: 'Curso de Arquitectura en la nube',
  color: '#1E88E5',
  status: ProjectStatus.active,
  createdAt: DateTime(2030, 1, 1),
  epic: const EpicRef(
    id: 'e1',
    name: 'Estudios Técnicos',
    colorCode: '#8E24AA',
  ),
  todoCount: 3,
  doneCount: 1,
);

void main() {
  testWidgets('ProjectCard renderiza dentro de un ListView sin overflow', (
    tester,
  ) async {
    var tapped = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: ListView(
            children: [
              ProjectCard(
                project: _project(),
                onTap: () => tapped = true,
                onEdit: () {},
                onDelete: () {},
              ),
            ],
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Curso de Arquitectura en la nube'), findsOneWidget);
    expect(find.text('Estudios Técnicos'), findsOneWidget);
    expect(find.text('Activo'), findsOneWidget);
    expect(find.text('1/3'), findsOneWidget);

    await tester.tap(find.text('Curso de Arquitectura en la nube'));
    expect(tapped, isTrue);
  });
}
