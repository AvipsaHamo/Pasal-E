import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { ShopService } from '../../core/services/shop.service';
import { ProductDetail, UpsertVariationRequest } from '../../core/models/shop.models';
import { Category } from '../../core/models/inventory.models';
import { InventoryService } from '../../core/services/inventory.service';
import { DestroyableComponent } from '../../core/base/destroyable.base';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent extends DestroyableComponent implements OnInit {
  @Input()  productId!: number;
  @Output() close = new EventEmitter<boolean>();

  product:    ProductDetail | null = null;
  categories: Category[]        = [];
  loading     = true;
  loadError   = '';
  saving      = false;
  saveError   = '';
  saveSuccess = false;

  form = this.fb.group({
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

  constructor(
    private shopSvc: ShopService,
    private invSvc:  InventoryService,
    private fb:      FormBuilder
  ) { super(); }

  ngOnInit(): void {
    // Load product detail and categories in parallel
    forkJoin({
      product:    this.shopSvc.getProductDetail(this.productId),
      categories: this.invSvc.getCategories()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ product, categories }) => {
          this.product    = product;
          this.categories = categories;
          this.loading    = false;
          this.patchForm(product);
        },
        error: (err: { error?: { message?: string } }) => {
          this.loading   = false;
          this.loadError = err?.error?.message ?? 'Failed to load product details.';
        }
      });
  }

  private patchForm(p: ProductDetail): void {
    this.form.patchValue({
      name:            p.name,
      categoryId:      p.categoryId   ?? null,
      description:     p.description  ?? '',
      vendorName:      p.vendorName   ?? '',
      stock:           p.stock,
      costPrice:       p.costPrice    ?? null,
      sellingPrice:    p.sellingPrice ?? null,
      onlineAvailable: p.onlineAvailable,
      addVariations:   p.variations.length > 0
    });

    this.variationsArray.clear();
    p.variations.forEach(v => this.variationsArray.push(this.fb.group({
      variationId:  [v.variationId],
      name:         [v.name ?? '', Validators.required],
      sellingPrice: [v.sellingPrice ?? null]
    })));
  }

  get variationsArray(): FormArray { return this.form.get('variations') as FormArray; }
  get showVariations():  boolean   { return !!this.form.get('addVariations')?.value; }

  getVarGroup(ctrl: unknown): FormGroup { return ctrl as FormGroup; }

  getVarControl(ctrl: AbstractControl | unknown, name: string): AbstractControl | null {
    return (ctrl as AbstractControl).get ? (ctrl as AbstractControl).get(name) : null;
  }

  addVariationRow(): void {
    this.variationsArray.push(this.fb.group({
      variationId:  [null],
      name:         ['', Validators.required],
      sellingPrice: [null as number | null]
    }));
  }

  removeVariation(i: number): void { this.variationsArray.removeAt(i); }

  onAddVariationsChange(): void {
    if (this.form.get('addVariations')?.value && this.variationsArray.length === 0)
      this.addVariationRow();
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.saveError = '';

    const v = this.form.value;
    const variations: UpsertVariationRequest[] = this.showVariations
      ? this.variationsArray.controls
          .filter(c => (c.get('name')?.value as string)?.trim())
          .map(c => ({
            variationId:  (c.get('variationId')?.value as number | null) ?? undefined,
            name:         (c.get('name')?.value as string) ?? '',
            sellingPrice: (c.get('sellingPrice')?.value as number | null) ?? undefined
          }))
      : [];

    this.shopSvc.updateProduct(this.productId, {
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
          setTimeout(() => this.close.emit(true), 700);
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving    = false;
          this.saveError = err?.error?.message ?? 'Failed to update product.';
        }
      });
  }

  onClose(): void { this.close.emit(false); }
}
