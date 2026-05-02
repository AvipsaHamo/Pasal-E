import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { InventoryService } from '../core/services/inventory.service';
import { Category, ProductListItem } from '../core/models/inventory.models';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { DestroyableComponent } from '../core/base/destroyable.base';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductDetailComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})
export class InventoryComponent extends DestroyableComponent implements OnInit {
  products:       ProductListItem[] = [];
  categories:     Category[]        = [];
  loadingProducts = false;
  showManualEntry = false;
  saving          = false;
  saveError       = '';
  saveSuccess     = false;

  selectedProductId: number | null = null;
  get showProductDetail(): boolean { return this.selectedProductId !== null; }

  private readonly searchSubject = new Subject<string>();

  productForm = this.fb.group({
    name:            ['', Validators.required],
    categoryId:      [null as number | null],
    description:     [''],
    vendorName:      [''],
    stock:           [0, [Validators.required, Validators.min(0)]],
    costPrice:       [null as number | null],
    sellingPrice:    [null as number | null],
    onlineAvailable: [true],
    addVariations:   [false],
    variations:      this.fb.array([])
  });

  constructor(private inv: InventoryService, private fb: FormBuilder) { super(); }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();

    // takeUntil cleans up the debounced search subscription on destroy
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => this.loadProducts(q));
  }

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

  loadCategories(): void {
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
    this.productForm.reset({ onlineAvailable: true, addVariations: false, stock: 0 });
    this.variationsArray.clear();
    this.saveError = ''; this.saveSuccess = false;
    this.showManualEntry = true;
  }

  closeManualEntry(): void { this.showManualEntry = false; }

  get variationsArray(): FormArray { return this.productForm.get('variations') as FormArray; }
  get showVariations():  boolean   { return !!this.productForm.get('addVariations')?.value; }

  getVariationGroup(ctrl: unknown): FormGroup { return ctrl as FormGroup; }

  getVariationControl(ctrl: AbstractControl | unknown, name: string): AbstractControl | null {
    return (ctrl as AbstractControl).get ? (ctrl as AbstractControl).get(name) : null;
  }

  addVariationRow(): void {
    this.variationsArray.push(this.fb.group({
      name:         ['', Validators.required],
      sellingPrice: [null as number | null]
    }));
  }

  removeVariation(i: number): void { this.variationsArray.removeAt(i); }

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
          this.loadProducts();
          setTimeout(() => this.closeManualEntry(), 800);
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving    = false;
          this.saveError = err?.error?.message ?? 'Failed to save product.';
        }
      });
  }

  openProductDetail(productId: number): void  { this.selectedProductId = productId; }

  onProductDetailClose(saved: boolean): void {
    this.selectedProductId = null;
    if (saved) this.loadProducts();
  }
}
