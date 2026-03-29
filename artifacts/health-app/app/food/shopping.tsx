import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { ShoppingListItem, useFood } from "@/context/FoodContext";

const SHOP_CATEGORIES = ["Produce", "Dairy", "Meat", "Grains", "Frozen", "Canned", "Snacks", "Beverages", "Other"];

export default function ShoppingListScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { shoppingList, addToShoppingList, updateShoppingItem, removeShoppingItem, toggleShoppingItem, clearCheckedItems } = useFood();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState("Other");
  const [notes, setNotes] = useState("");

  const bg = isDark ? Colors.dark.background : Colors.background;
  const cardBg = isDark ? Colors.dark.card : Colors.card;
  const textColor = isDark ? Colors.dark.text : Colors.text;
  const textSecondary = isDark ? Colors.dark.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? Colors.dark.border : Colors.border;
  const inputBg = isDark ? Colors.dark.surfaceAlt : Colors.surfaceAlt;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const unchecked = shoppingList.filter((i) => !i.checked);
  const checked = shoppingList.filter((i) => i.checked);

  const grouped = unchecked.reduce((acc, item) => {
    const key = item.category || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  const openAdd = () => { setName(""); setQuantity("1"); setCategory("Other"); setNotes(""); setEditId(null); setShowModal(true); };
  const openEdit = (item: ShoppingListItem) => { setName(item.name); setQuantity(item.quantity); setCategory(item.category); setNotes(item.notes ?? ""); setEditId(item.id); setShowModal(true); };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert("Name required"); return; }
    if (editId) { updateShoppingItem(editId, { name: name.trim(), quantity, category, notes: notes.trim() || undefined }); }
    else { addToShoppingList({ name: name.trim(), quantity, category, checked: false, notes: notes.trim() || undefined }); }
    setShowModal(false);
  };

  const handleClearChecked = () => {
    Alert.alert("Clear checked items?", "This will remove all checked items from the list.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearCheckedItems },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Shopping List</Text>
        <View style={styles.headerActions}>
          {checked.length > 0 && (
            <TouchableOpacity onPress={handleClearChecked} style={styles.headerBtn}>
              <Feather name="trash-2" size={20} color={Colors.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={openAdd}>
            <Feather name="plus" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.summaryBar, { backgroundColor: Colors.secondary + "10" }]}>
        <Text style={[styles.summaryText, { color: Colors.secondary }]}>
          {unchecked.length} items · {checked.length} checked
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(grouped).map(([cat, items]) => (
          <View key={cat} style={styles.categoryGroup}>
            <Text style={[styles.categoryLabel, { color: textSecondary }]}>{cat}</Text>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemRow, { backgroundColor: cardBg, borderColor }]}
                onPress={() => toggleShoppingItem(item.id)}
                onLongPress={() => openEdit(item)}
              >
                <View style={[styles.checkCircle, { borderColor: Colors.secondary }]}>
                  {item.checked && <Feather name="check" size={12} color={Colors.secondary} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
                  {item.notes ? <Text style={[styles.itemNotes, { color: textSecondary }]}>{item.notes}</Text> : null}
                </View>
                <Text style={[styles.itemQty, { color: Colors.secondary }]}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => removeShoppingItem(item.id)} style={styles.removeBtn}>
                  <Feather name="x" size={14} color={Colors.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {checked.length > 0 && (
          <View style={styles.categoryGroup}>
            <Text style={[styles.categoryLabel, { color: textSecondary }]}>Checked ({checked.length})</Text>
            {checked.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemRow, { backgroundColor: cardBg, borderColor, opacity: 0.5 }]}
                onPress={() => toggleShoppingItem(item.id)}
              >
                <View style={[styles.checkCircle, { borderColor: Colors.primary, backgroundColor: Colors.primary }]}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: textColor, textDecorationLine: "line-through" }]}>{item.name}</Text>
                </View>
                <Text style={[styles.itemQty, { color: textSecondary }]}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => removeShoppingItem(item.id)} style={styles.removeBtn}>
                  <Feather name="x" size={14} color={Colors.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {shoppingList.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="shopping-cart" size={48} color={Colors.border} />
            <Text style={[styles.emptyTitle, { color: textSecondary }]}>Shopping list is empty</Text>
            <Text style={[styles.emptySub, { color: textSecondary }]}>Tap + to add items</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalContainer, { backgroundColor: bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={[styles.cancelText, { color: textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: textColor }]}>{editId ? "Edit Item" : "Add Item"}</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.saveText, { color: Colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.formScroll}>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Item Name *</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="e.g. Greek Yogurt"
                placeholderTextColor={textSecondary}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Quantity</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="e.g. 2 lbs"
                placeholderTextColor={textSecondary}
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Notes</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="Optional notes"
                placeholderTextColor={textSecondary}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Category</Text>
              <View style={styles.catGrid}>
                {SHOP_CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.catBtn, category === c && { backgroundColor: Colors.primary }]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.catBtnText, { color: category === c ? "#fff" : textSecondary }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  headerActions: { flexDirection: "row", gap: 4, alignItems: "center" },
  headerBtn: { padding: 4 },
  summaryBar: { paddingHorizontal: 16, paddingVertical: 6 },
  summaryText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  scrollContent: { padding: 12 },
  categoryGroup: { marginBottom: 16 },
  categoryLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginLeft: 4 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  itemName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  itemNotes: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  itemQty: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  removeBtn: { padding: 4 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  cancelText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  saveText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  formScroll: { padding: 16 },
  formField: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldInput: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: Colors.surfaceAlt },
  catBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
