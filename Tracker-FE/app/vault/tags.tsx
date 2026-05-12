import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { GlowButton } from '@/components/ui/GlowButton';
import { EmptyState } from '@/components/layout/EmptyState';
import { useVaultTags, useCreateTag, useDeleteTag } from '@/hooks/useFinance';
import { GradientCard, IconTile } from './_components';

const SWATCHES = ['#fbbf24', '#a3e635', '#4ade80', '#fb923c', '#f59e0b', '#f97316', '#ef4444', '#fde047'];

export default function TagsScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const tags = useVaultTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#fb923c');

  const submit = async () => {
    if (!name) return;
    await createTag.mutateAsync({ name, color });
    setName('');
  };

  return (
    <ThemedScene scene="vault">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={tags.isFetching} onRefresh={() => tags.refetch()} />}>
        <PageHeader
          title="Tags"
          subtitle={`${(tags.data?.tags ?? []).length} colorful labels`}
          accent={accent}
          accent2={accent2}
          right={
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        <View style={{ marginHorizontal: 20 }}>
          <GradientCard accent="#fb923c" accent2={accent} intensity={0.16}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconTile icon="pricetags" accent="#fb923c" size={44} iconSize={22} />
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Cross-cutting labels</Text>
                <Text style={styles.heroSub}>vacation-goa · work-trip · gift</Text>
              </View>
            </View>
          </GradientCard>
        </View>

        <SectionTitle title="Create tag" accent="#fb923c" />
        <View style={{ paddingHorizontal: 20 }}>
          <View style={[styles.inputWrap, { borderColor: color + '66' }]}>
            <View style={[styles.colorPreview, { backgroundColor: color }]} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="tag name…"
              placeholderTextColor={palette.textDim}
              style={styles.input}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {SWATCHES.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.swatch, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: palette.text }]}>
                {color === c && <Ionicons name="checkmark" size={14} color="#0b0b14" />}
              </Pressable>
            ))}
          </View>
          <View style={{ height: 14 }} />
          <GlowButton title="Create tag" color={color} onPress={submit} loading={createTag.isPending} />
        </View>

        <SectionTitle title="Your tags" accent={accent} />
        {(tags.data?.tags ?? []).length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="pricetags" title="No tags yet" message="Tags cut across categories. Useful for trips, gifts, projects." accent={accent} />
          </View>
        ) : (
          <View style={styles.tagCloud}>
            {(tags.data?.tags ?? []).map((t) => (
              <View key={t.id} style={styles.tagWrap}>
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#10101c', borderRadius: 999 }]} />
                <LinearGradient
                  colors={[t.color + '36', '#10101cf0', t.color + '18']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={[StyleSheet.absoluteFillObject, { borderRadius: 999, borderWidth: 1, borderColor: t.color + '88' }]} />
                <View style={[styles.tagBody]}>
                  <View style={[styles.tagDot, { backgroundColor: t.color, shadowColor: t.color }]} />
                  <Text style={[styles.tagName, { color: palette.text }]}>{t.name}</Text>
                  <Pressable onPress={() => deleteTag.mutate(t.id)} hitSlop={8}>
                    <Ionicons name="close-circle" size={14} color={palette.textDim} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  heroTitle: { color: palette.text, fontSize: 16, fontWeight: '900' },
  heroSub: { color: palette.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#10101c',
    borderRadius: 12,
    borderWidth: 1,
    paddingLeft: 10,
  },
  colorPreview: { width: 14, height: 14, borderRadius: 7 },
  input: {
    flex: 1,
    color: palette.text,
    padding: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  swatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tagCloud: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagWrap: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  tagBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  tagDot: { width: 10, height: 10, borderRadius: 5, shadowOpacity: 0.8, shadowRadius: 4 },
  tagName: { fontWeight: '900', fontSize: 13 },
});
