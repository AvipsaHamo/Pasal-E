import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { ShopService } from '../../core/services/shop.service';
import { ProductDetail, UpsertVariationRequest } from '../../core/models/shop.models';
import { Category } from '../../core/models/inventory.models';
import { InventoryService } from '../../core/services/inventory.service';
import { DestroyableComponent } from '../../core/base/destroyable.base';
import { ImageProxyPipe } from '../../core/pipes/image-proxy.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageProxyPipe],
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
  uploadingImage = false;
  imageUploadError = '';

  form = this.fb.group({
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
      image:           p.image        ?? '',
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
      image:        [v.image ?? null],
      sellingPrice: [v.sellingPrice ?? null, [Validators.required, Validators.min(0)]]
    })));
  }

  get variationsArray(): FormArray { return this.form.get('variations') as FormArray; }
  get showVariations():  boolean   { return !!this.form.get('addVariations')?.value; }

  getVarGroup(ctrl: unknown): FormGroup { return ctrl as FormGroup; }

  getVarControl(ctrl: AbstractControl | unknown, name: string): FormControl {
    return (ctrl as FormGroup).get(name) as FormControl;
  }

  addVariationRow(): void {
    this.variationsArray.push(this.fb.group({
      variationId:  [null],
      name:         ['', Validators.required],
      image:        [null as string | null],
      sellingPrice: [null as number | null, [Validators.required, Validators.min(0)]]
    }));
  }

  onImageUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadingImage = true;
    this.imageUploadError = '';

    this.shopSvc.uploadImage(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.uploadingImage = false;
          this.form.patchValue({ image: res.url });
        },
        error: (err: { error?: { message?: string } }) => {
          this.uploadingImage = false;
          this.imageUploadError = err?.error?.message ?? 'Image upload failed.';
        }
      });
  }

  removeVariation(i: number): void { this.variationsArray.removeAt(i); }

  onAddVariationsChange(): void {
    if (this.form.get('addVariations')?.value && this.variationsArray.length === 0) {
      this.addVariationRow();
      return;
    }
    if (!this.form.get('addVariations')?.value) {
      this.variationsArray.clear();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.saveError = '';

    const v = this.form.value;
    const productImage = ((v.image as string | null) ?? '').trim();
    const variations: UpsertVariationRequest[] = this.showVariations
      ? this.variationsArray.controls
          .map(c => ({
            variationId:  (c.get('variationId')?.value as number | null) ?? undefined,
            name:         (c.get('name')?.value as string) ?? '',
            image:        ((c.get('image')?.value as string | null) ?? '').trim() || productImage || undefined,
            sellingPrice: (c.get('sellingPrice')?.value as number | null) ?? undefined
          }))
      : [];

    this.shopSvc.updateProduct(this.productId, {
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
          setTimeout(() => this.close.emit(true), 700);
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving    = false;
          this.saveError = err?.error?.message ?? 'Failed to update product.';
        }
      });
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  isVariationControlInvalid(index: number, controlName: string): boolean {
    const control = this.variationsArray.at(index)?.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  isRequiredError(control: AbstractControl | null): boolean {
    return !!control && control.touched && control.hasError('required');
  }

  variationPreviewImage(ctrl: AbstractControl | unknown): string {
    const varImage = (((ctrl as FormGroup).get('image')?.value as string | null) ?? '').trim();
    if (varImage) return varImage;
    return ((this.form.get('image')?.value as string | null) ?? '').trim();
  }

  onClose(): void { this.close.emit(false); }
}
