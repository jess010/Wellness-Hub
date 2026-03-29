import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { FoodItem, useFood } from "@/context/FoodContext";

const CATEGORIES = ["Fruits", "Vegetables", "Protein", "Grains", "Dairy", "Snacks", "Beverages", "Other"];

interface FoodForm {
  name: string;
  category: string;
  points: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  servingSize: string;
  brand: string;
}

const EMPTY_FORM: FoodForm = {
  name: "", category: "Other", points: "0",
  calories: "", protein: "", carbs: "", fat: "",
  servingSize: "1 serving", brand: "",
};

export default function FoodDatabaseScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { foodDatabase, addFoodItem, updateFoodItem, deleteFoodItem } = useFood();

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FoodForm>(EMPTY_FORM);
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filtered = foodDatabase.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" || f.category === filterCategory;
    return matchSearch && matchCat;
  });

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); };
  const openEdit = (item: FoodItem) => {
    setForm({
      name: item.name, category: item.category, points: String(item.points),
      calories: String(item.calories ?? ""), protein: String(item.protein ?? ""),
      carbs: String(item.carbs ?? ""), fat: String(item.fat ?? ""),
      servingSize: item.servingSize, brand: item.brand ?? "",
    });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { Alert.alert("Name required"); return; }
    const data = {
      name: form.name.trim(),
      category: form.category,
      points: parseFloat(form.points) || 0,
      calories: form.calories ? parseFloat(form.calories) : undefined,
      protein: form.protein ? parseFloat(form.protein) : undefined,
      carbs: form.carbs ? parseFloat(form.carbs) : undefined,
      fat: form.fat ? parseFloat(form.fat) : undefined,
      servingSize: form.servingSize.trim() || "1 serving",
      brand: form.brand.trim() || undefined,
    };
    if (editId) { updateFoodItem(editId, data); }
    else { addFoodItem(data); }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert("Delete food", `Remove "${name}" from database?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteFoodItem(id) },
    ]);
  };

  const allCategories = ["All", ...CATEGORIES];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Food Database</Text>
        <TouchableOpacity onPress={openAdd}>
          <Feather name="plus" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor, margin: 12 }]}>
        <Feather name="search" size={16} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search database..."
          placeholderTextColor={textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catFilters}>
        {allCategories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, filterCategory === cat && { backgroundColor: Colors.primary }]}
            onPress={() => setFilterCategory(cat)}
          >
            <Text style={[styles.catChipText, { color: filterCategory === cat ? "#fff" : textSecondary }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={[styles.foodRow, { borderBottomColor: borderColor }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.foodName, { color: textColor }]}>{item.name}</Text>
              <Text style={[styles.foodMeta, { color: textSecondary }]}>
                {item.category} · {item.servingSize}{item.brand ? ` · ${item.brand}` : ""}
              </Text>
            </View>
            <View style={[styles.ptsBadge, { backgroundColor: Colors.food + "20" }]}>
              <Text style={[styles.ptsText, { color: Colors.food }]}>{item.points} pts</Text>
            </View>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
              <Feather name="edit-2" size={15} color={textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.iconBtn}>
              <Feather name="trash-2" size={15} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="database" size={40} color={Colors.border} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>No foods found</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={[styles.cancelText, { color: textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>{editId ? "Edit Food" : "Add Food"}</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveText, { color: Colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll}>
            {[
              { label: "Food Name *", key: "name", placeholder: "e.g. Grilled Chicken" },
              { label: "Serving Size", key: "servingSize", placeholder: "e.g. 4 oz" },
              { label: "Brand (optional)", key: "brand", placeholder: "e.g. Tyson" },
              { label: "Points *", key: "points", placeholder: "0", keyboardType: "decimal-pad" },
              { label: "Calories", key: "calories", placeholder: "optional", keyboardType: "decimal-pad" },
              { label: "Protein (g)", key: "protein", placeholder: "optional", keyboardType: "decimal-pad" },
              { label: "Carbs (g)", key: "carbs", placeholder: "optional", keyboardType: "decimal-pad" },
              { label: "Fat (g)", key: "fat", placeholder: "optional", keyboardType: "decimal-pad" },
            ].map((field) => (
              <View key={field.key} style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>{field.label}</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={textSecondary}
                  value={form[field.key as keyof FoodForm]}
                  onChangeText={(v) => setForm((p) => ({ ...p, [field.key]: v }))}
                  keyboardType={(field as any).keyboardType ?? "default"}
                />
              </View>
            ))}
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.catOptions}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catOption, form.category === c && { backgroundColor: Colors.primary }]}
                      onPress={() => setForm((p) => ({ ...p, category: c }))}
                    >
                      <Text style={[styles.catOptionText, { color: form.category === c ? "#fff" : textSecondary }]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  catFilters: { paddingHorizontal: 12, paddingBottom: 10, gap: 6, flexDirection: "row" },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: Colors.surfaceAlt },
  catChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  foodName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  foodMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  ptsBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  ptsText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  iconBtn: { padding: 6 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  cancelText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  saveText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  formScroll: { padding: 16, gap: 4 },
  formField: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  catOptions: { flexDirection: "row", gap: 6 },
  catOption: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: Colors.surfaceAlt },
  catOptionText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
