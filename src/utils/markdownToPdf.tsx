/**
 * @module markdownToPdf
 * @description Utilitaires pour convertir du Markdown en composants react-pdf
 * pour l'export PDF avec formatage préservé.
 */

import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

// Styles pour les éléments markdown dans le PDF
const markdownStyles = StyleSheet.create({
  paragraph: {
    marginBottom: 8,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  heading2: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 10,
  },
  listBullet: {
    width: 15,
  },
  listContent: {
    flex: 1,
    lineHeight: 1.4,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  orderedListItem: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 10,
  },
  orderedListNumber: {
    width: 20,
  },
});

interface MarkdownElement {
  type: 'paragraph' | 'heading2' | 'heading3' | 'list-item' | 'ordered-list-item' | 'empty';
  content: string;
  order?: number;
}

/**
 * Parse le contenu markdown en éléments structurés
 */
const parseMarkdown = (content: string): MarkdownElement[] => {
  const lines = content.split('\n');
  const elements: MarkdownElement[] = [];
  let orderedListCounter = 0;
  let inOrderedList = false;

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Ligne vide
    if (!trimmedLine) {
      elements.push({ type: 'empty', content: '' });
      inOrderedList = false;
      orderedListCounter = 0;
      return;
    }

    // Titre de niveau 2 (##)
    if (trimmedLine.startsWith('## ')) {
      elements.push({
        type: 'heading2',
        content: trimmedLine.substring(3),
      });
      inOrderedList = false;
      orderedListCounter = 0;
      return;
    }

    // Titre de niveau 3 (###)
    if (trimmedLine.startsWith('### ')) {
      elements.push({
        type: 'heading3',
        content: trimmedLine.substring(4),
      });
      inOrderedList = false;
      orderedListCounter = 0;
      return;
    }

    // Liste non ordonnée (-, *, +)
    if (/^[-*+]\s/.test(trimmedLine)) {
      elements.push({
        type: 'list-item',
        content: trimmedLine.substring(2),
      });
      inOrderedList = false;
      orderedListCounter = 0;
      return;
    }

    // Liste ordonnée (1., 2., etc.)
    const orderedMatch = trimmedLine.match(/^(\d+)\.\s/);
    if (orderedMatch) {
      if (!inOrderedList) {
        inOrderedList = true;
        orderedListCounter = parseInt(orderedMatch[1]);
      } else {
        orderedListCounter++;
      }
      elements.push({
        type: 'ordered-list-item',
        content: trimmedLine.substring(orderedMatch[0].length),
        order: orderedListCounter,
      });
      return;
    }

    // Paragraphe normal
    elements.push({
      type: 'paragraph',
      content: trimmedLine,
    });
    inOrderedList = false;
    orderedListCounter = 0;
  });

  return elements;
};

/**
 * Traite le texte inline (gras, italique) et retourne un tableau de composants Text
 */
const processInlineFormatting = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Ajouter le texte avant le match
    if (match.index > currentIndex) {
      parts.push(
        <Text key={`text-${currentIndex}`}>
          {text.substring(currentIndex, match.index)}
        </Text>
      );
    }

    // Ajouter le texte formaté
    if (match[1]) {
      // Gras (**texte**)
      parts.push(
        <Text key={`bold-${match.index}`} style={markdownStyles.bold}>
          {match[2]}
        </Text>
      );
    } else if (match[3]) {
      // Italique (*texte*)
      parts.push(
        <Text key={`italic-${match.index}`} style={markdownStyles.italic}>
          {match[4]}
        </Text>
      );
    }

    currentIndex = match.index + match[0].length;
  }

  // Ajouter le reste du texte
  if (currentIndex < text.length) {
    parts.push(<Text key={`text-${currentIndex}`}>{text.substring(currentIndex)}</Text>);
  }

  return parts.length > 0 ? parts : [<Text key="default">{text}</Text>];
};

/**
 * Convertit un élément markdown en composant react-pdf
 */
const renderMarkdownElement = (element: MarkdownElement, index: number): React.ReactNode => {
  switch (element.type) {
    case 'heading2':
      return (
        <Text key={`h2-${index}`} style={markdownStyles.heading2}>
          {element.content}
        </Text>
      );

    case 'heading3':
      return (
        <Text key={`h3-${index}`} style={markdownStyles.heading3}>
          {element.content}
        </Text>
      );

    case 'list-item':
      return (
        <View key={`li-${index}`} style={markdownStyles.listItem}>
          <Text style={markdownStyles.listBullet}>•</Text>
          <Text style={markdownStyles.listContent}>
            {processInlineFormatting(element.content)}
          </Text>
        </View>
      );

    case 'ordered-list-item':
      return (
        <View key={`oli-${index}`} style={markdownStyles.orderedListItem}>
          <Text style={markdownStyles.orderedListNumber}>{element.order}.</Text>
          <Text style={markdownStyles.listContent}>
            {processInlineFormatting(element.content)}
          </Text>
        </View>
      );

    case 'empty':
      return <Text key={`empty-${index}`} style={{ marginBottom: 4 }}> </Text>;

    case 'paragraph':
    default:
      return (
        <Text key={`p-${index}`} style={markdownStyles.paragraph}>
          {processInlineFormatting(element.content)}
        </Text>
      );
  }
};

/**
 * Convertit du contenu Markdown en composants react-pdf
 * @param content - Le contenu markdown à convertir
 * @returns Un tableau de composants react-pdf
 */
export const markdownToPdfComponents = (content: string): React.ReactNode[] => {
  if (!content) return [];

  const elements = parseMarkdown(content);
  return elements.map((element, index) => renderMarkdownElement(element, index));
};
