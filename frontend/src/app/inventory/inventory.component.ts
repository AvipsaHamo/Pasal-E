// src/app/inventory/inventory.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { InventoryService } from '../core/services/inventory.service';
import { Category, ProductListItem } from '../core/models/inventory.models';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { DestroyableComponent } from '../core/base/destroyable.base';
import { ShopService } from '../core/services/shop.service';
import { ImageProxyPipe } from '../core/pipes/image-proxy.pipe';
import { CategoryDetail } from '../core/models/shop.models';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductDetailComponent, ImageProxyPipe],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})
export class InventoryComponent extends DestroyableComponent implements OnInit {
  private readonly bodyScrollLockClass = 'inventory-modal-open';

  // ── Products ──────────────────────────────────────────────────────────
  products:       ProductListItem[] = [];
  categories:     Category[]        = [];
  loadingProducts = false;
  saving          = false;
  saveError       = '';
  saveSuccess     = false;

  // Manual entry panel
  showManualEntry    = false;
  uploadingImage     = false;
  imageUploadError   = '';
  newProductImageUrl = '';

  // View details modal
  selectedProductId: number | null = null;
  get showProductDetail(): boolean { return this.selectedProductId !== null; }

  // Delete confirmation modal
  showDeleteConfirmModal = false;
  deleteProductId: number | null = null;
  deleteProductName: string = '';
  deletingProduct = false;
  deleteError = '';
  deleteTargetIsCategory = false; // if true, modal will delete a category instead of a product

  // Search
  private readonly searchSubject = new Subject<string>();

  // ── Category modal state (3 layers) ───────────────────────────────────
  // Layer 1: Shop Category list window
  showCategoryWindow   = false;
  shopCategories:       CategoryDetail[] = [];
  loadingCategories    = false;

  // Layer 2: Add New Category popup
  showAddCategoryModal = false;
  addingCategory       = false;
  addCategoryError     = '';
  newCategoryImageUrl: string | null = null;
  uploadingCatImg      = false;

  // Product form
  productForm = this.fb.group({
    name:            ['', Validators.required],
    categoryId:      [null as number | null],
    description:     ['', Validators.required],
    image:           ['', Validators.required],
    vendorName:      [''],
    stock:           [0, [Validators.required, Validators.min(0)]],
    costPrice:       [null as number | null, [Validators.required, Validators.min(0)]],
    sellingPrice:    [null as number | null, [Validators.required, Validators.min(0)]],
    onlineAvailable: [true],
    addVariations:   [false],
    variations:      this.fb.array([])
  });

  // Category form
  categoryForm = this.fb.group({
    name: ['', Validators.required]
  });

  constructor(
    private inv:     InventoryService,
    private shopSvc: ShopService,
    private fb:      FormBuilder
  ) { super(); }

  ngOnInit(): void {
    this.loadProducts();
    this.loadProductCategories();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.loadProducts(q));
  }

  override ngOnDestroy(): void {
    this.setBodyScrollLock(false);
    super.ngOnDestroy();
  }

  // ── Products ──────────────────────────────────────────────────────────
  loadProducts(search?: string): void {
    this.loadingProducts = true;
    this.inv.getProducts(search)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  p => { this.products = p; this.loadingProducts = false; },
        error: (err: { error?: { message?: string } }) => {
          this.loadingProducts = false;
          console.error('Failed to load products:', err?.error?.message ?? err);
        }
      });
  }

  loadProductCategories(): void {
    this.inv.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  c => this.categories = c,
        error: (err: { error?: { message?: string } }) =>
          console.error('Failed to load categories:', err?.error?.message ?? err)
      });
  }

  onSearch(event: Event): void {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  openManualEntry(): void {
    this.productForm.reset({ onlineAvailable: true, addVariations: false, stock: 0, image: '' });
    this.variationsArray.clear();
    this.saveError = ''; this.saveSuccess = false; this.imageUploadError = ''; this.newProductImageUrl = '';
    this.showManualEntry = true;
    this.setBodyScrollLock(true);
  }

  closeManualEntry(): void {
    this.showManualEntry = false;
    this.syncBodyScrollLock();
  }

  get variationsArray(): FormArray { return this.productForm.get('variations') as FormArray; }
  get showVariations():  boolean   { return !!this.productForm.get('addVariations')?.value; }

  getVariationGroup(ctrl: unknown): FormGroup { return ctrl as FormGroup; }

  getVariationNameControl(ctrl: unknown): FormControl {
    return this.getVariationGroup(ctrl).controls['name'] as FormControl;
  }

  getVariationPriceControl(ctrl: unknown): FormControl {
    return this.getVariationGroup(ctrl).controls['sellingPrice'] as FormControl;
  }

  addVariationRow(): void {
    this.variationsArray.push(this.fb.group({
      name:         ['', Validators.required],
      sellingPrice: [null as number | null, [Validators.required, Validators.min(0)]]
    }));
  }

  removeVariation(i: number): void { this.variationsArray.removeAt(i); }

  onProductImageUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadingImage = true;
    this.imageUploadError = '';

    this.shopSvc.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.uploadingImage = false;
          this.newProductImageUrl = res.url;
          this.productForm.patchValue({ image: res.url });
        },
        error: (err: { error?: { message?: string } }) => {
          this.uploadingImage = false;
          this.imageUploadError = err?.error?.message ?? 'Image upload failed.';
        }
      });
  }

  onAddVariationsChange(): void {
    const checked = this.productForm.get('addVariations')?.value;
    if (checked && this.variationsArray.length === 0) {
      this.addVariationRow(); this.addVariationRow();
    }
    if (!checked) this.variationsArray.clear();
  }

  onSubmit(): void {
    if (this.productForm.invalid) { this.productForm.markAllAsTouched(); return; }
    this.saving = true; this.saveError = '';
    const v = this.productForm.value;

    const variations = this.showVariations
      ? this.variationsArray.controls
          .filter(c => c.get('name')?.value?.trim())
          .map(c => ({
            name:         (c.get('name')?.value as string) ?? '',
            sellingPrice: (c.get('sellingPrice')?.value as number | null) ?? undefined
          }))
      : [];

    this.inv.createProduct({
      name:            v.name            ?? '',
      categoryId:      v.categoryId      ?? undefined,
      description:     v.description     || undefined,
      image:           v.image           || undefined,
      vendorName:      v.vendorName      || undefined,
      stock:           v.stock           ?? 0,
      costPrice:       v.costPrice       ?? undefined,
      sellingPrice:    v.sellingPrice    ?? undefined,
      onlineAvailable: v.onlineAvailable ?? true,
      variations:      variations.length ? variations : undefined
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false; this.saveSuccess = true;
          this.loadProducts(); this.loadProductCategories();
          setTimeout(() => this.closeManualEntry(), 800);
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving    = false;
          this.saveError = err?.error?.message ?? 'Failed to save product.';
        }
      });
  }

  onSubmitProduct(): void {
    this.onSubmit();
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.productForm.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  isVariationControlInvalid(index: number, controlName: string): boolean {
    const control = this.variationsArray.at(index)?.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  isRequiredError(control: AbstractControl | null): boolean {
    return !!control && control.touched && control.hasError('required');
  }

  variationPreviewImage(): string {
    return ((this.productForm.get('image')?.value as string | null) ?? '').trim();
  }

  openProductDetail(productId: number): void  { this.selectedProductId = productId; }

  onProductDetailClose(saved: boolean): void {
    this.selectedProductId = null;
    if (saved) this.loadProducts();
  }

  // ── Delete Product Confirmation Modal ─────────────────────────────────
  openDeleteConfirmModal(productId: number, productName: string): void {
    this.deleteTargetIsCategory = false;
    this.deleteProductId = productId;
    this.deleteProductName = productName;
    this.deleteError = '';
    this.showDeleteConfirmModal = true;
    this.setBodyScrollLock(true);
  }

  openDeleteConfirmCategoryModal(categoryId: number, categoryName: string): void {
    this.deleteTargetIsCategory = true;
    this.deleteProductId = categoryId;
    this.deleteProductName = categoryName;
    this.deleteError = '';
    this.showDeleteConfirmModal = true;
    this.setBodyScrollLock(true);
  }

  closeDeleteConfirmModal(): void {
    this.showDeleteConfirmModal = false;
    this.deleteProductId = null;
    this.deleteProductName = '';
    this.deleteError = '';
    this.deleteTargetIsCategory = false;
    this.syncBodyScrollLock();
  }

  onConfirmDeleteProduct(): void {
    if (!this.deleteProductId) return;

    this.deletingProduct = true;
    this.deleteError = '';
    if (this.deleteTargetIsCategory) {
      // delete a category
      const cid = this.deleteProductId;
      this.shopSvc.deleteCategory(cid!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.deletingProduct = false;
            this.showDeleteConfirmModal = false;
            this.syncBodyScrollLock();
            this.loadShopCategories();
            this.loadProductCategories();
          },
          error: (err: { error?: { message?: string } }) => {
            this.deletingProduct = false;
            this.deleteError = err?.error?.message ?? 'Failed to delete category.';
          }
        });
      return;
    }

    // delete a product
    this.inv.deleteProduct(this.deleteProductId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deletingProduct = false;
          this.showDeleteConfirmModal = false;
          this.syncBodyScrollLock();
          this.loadProducts(); // refresh list
        },
        error: (err: { error?: { message?: string } }) => {
          this.deletingProduct = false;
          this.deleteError = err?.error?.message ?? 'Failed to delete product.';
        }
      });
  }

  // ── Category Window (Layer 1) ─────────────────────────────────────────
  openCategoryWindow(): void {
    this.showCategoryWindow = true;
    this.loadShopCategories();
    this.setBodyScrollLock(true);
  }

  closeCategoryWindow(): void {
    this.showCategoryWindow   = false;
    this.showAddCategoryModal = false;
    // Refresh the dropdown in manual entry if it's open
    this.loadProductCategories();
    this.syncBodyScrollLock();
  }

  loadShopCategories(): void {
    this.loadingCategories = true;
    this.shopSvc.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  c => { this.shopCategories = c; this.loadingCategories = false; },
        error: (err: { error?: { message?: string } }) => {
          this.loadingCategories = false;
          console.error('Failed to load shop categories:', err?.error?.message ?? err);
        }
      });
  }

  deleteCategory(id: number): void {
    // open the shared delete confirmation modal for categories
    const catName = this.shopCategories.find(c => c.categoryId === id)?.name ?? '';
    this.openDeleteConfirmCategoryModal(id, catName);
  }

  // ── Add Category Modal (Layer 2) ──────────────────────────────────────
  openAddCategoryModal(): void {
    this.categoryForm.reset();
    this.newCategoryImageUrl = null;
    this.addCategoryError    = '';
    this.showAddCategoryModal = true;
    this.setBodyScrollLock(true);
  }

  closeAddCategoryModal(): void {
    this.showAddCategoryModal = false;
    // Backdrop click on Layer 2 goes back to Layer 1 (category window stays open)
    this.syncBodyScrollLock();
  }

  onCategoryImageUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingCatImg = true;
    this.shopSvc.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  res => { this.uploadingCatImg = false; this.newCategoryImageUrl = res.url; },
        error: (err: { error?: { message?: string } }) => {
          this.uploadingCatImg  = false;
          this.addCategoryError = err?.error?.message ?? 'Image upload failed.';
        }
      });
  }

  onAddCategory(): void {
    if (this.categoryForm.invalid) { this.categoryForm.markAllAsTouched(); return; }
    this.addingCategory = true; this.addCategoryError = '';
    const name = this.categoryForm.value.name ?? '';

    this.shopSvc.addCategory({ name, image: this.newCategoryImageUrl ?? undefined })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.addingCategory       = false;
          this.showAddCategoryModal = false;
          this.loadShopCategories(); // refresh list in Layer 1
          this.syncBodyScrollLock();
        },
        error: (err: { error?: { message?: string } }) => {
          this.addingCategory   = false;
          this.addCategoryError = err?.error?.message ?? 'Failed to add category.';
        }
      });
  }

  private setBodyScrollLock(locked: boolean): void {
    if (typeof document === 'undefined') return;

    document.body.classList.toggle(this.bodyScrollLockClass, locked);
  }

  private syncBodyScrollLock(): void {
    this.setBodyScrollLock(
      this.showManualEntry ||
      this.showCategoryWindow ||
      this.showAddCategoryModal ||
      this.showProductDetail
    );
  }
}
