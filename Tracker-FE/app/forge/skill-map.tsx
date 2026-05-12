import React from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { EmptyState } from '@/components/layout/EmptyState';
import { SkillMapGrid } from '@/components/forge/SkillMapGrid';
import { useRustySkills, useSkillMap, useUpdateSkill } from '@/hooks/useLearning';
import type { Proficiency } from '@/types';

const PROFS: Proficiency[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function SkillMap() {
  const accent = screenTheme.forge.accent;
  const map = useSkillMap();
  const rusty = useRustySkills();
  const update = useUpdateSkill();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView refreshControl={<RefreshControl tintColor={accent} refreshing={map.isFetching} onRefresh={() => { map.refetch(); rusty.refetch(); }} />}>
        <PageHeader title="Skill Map" subtitle="Forge" accent={accent} accent2={screenTheme.forge.accent2} />

        {(map.data?.skills?.length ?? 0) === 0 && !map.isFetching && (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="grid-outline"
              title="No skills yet."
              message="Log a session against a project with a tech stack, or add learning topics — they'll show up here."
              accent={accent}
            />
          </View>
        )}

        {Object.entries(map.data?.categories ?? {}).map(([category, skills]) => (
          <View key={category}>
            <SectionTitle title={category} accent={accent} />
            <View style={{ paddingHorizontal: 20 }}>
              <SkillMapGrid
                skills={skills}
                onPressSkill={(s) => {
                  // cycle proficiency
                  const next = PROFS[(PROFS.indexOf(s.proficiency) + 1) % PROFS.length];
                  update.mutate({ id: s.id, body: { proficiency: next } });
                }}
              />
            </View>
          </View>
        ))}

        {(rusty.data?.skills ?? []).length > 0 && (
          <>
            <SectionTitle title="🟡 Rusty Skills (60d+ unused)" accent="#fbbf24" />
            <View style={{ paddingHorizontal: 20 }}>
              <SkillMapGrid skills={rusty.data!.skills} />
            </View>
          </>
        )}

        <Text style={styles.hint}>Tap a skill to cycle proficiency.</Text>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { color: palette.textDim, textAlign: 'center', marginTop: 20, fontSize: 11 },
});
